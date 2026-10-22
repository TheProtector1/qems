import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { Gender, ProgramType } from "@prisma/client";
import { normalizePhone, parentLoginEmail } from "@/lib/phone";
import { generateInvoiceNo } from "@/lib/utils";
import { resolveInitialProgress } from "@/lib/student-progress";
import { syncStudentClassEnrollments } from "@/lib/student-enrollments";

export const dynamic = "force-dynamic";

interface BulkStudentRow {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  fatherName: string;
  parentPhone: string;
  parentEmail?: string;
  program: string;
  city?: string;
  address?: string;
  currentJuz?: string | number;
  feeAmount?: string | number;
}

function mapGender(val: string): Gender {
  const v = (val || "").trim().toUpperCase();
  if (v === "FEMALE" || v === "F") return Gender.FEMALE;
  return Gender.MALE;
}

function mapProgram(val: string): ProgramType {
  const v = (val || "").trim().toUpperCase();
  if (v === "NAZRA") return ProgramType.NAZRA;
  if (v === "TAJWEED") return ProgramType.TAJWEED;
  return ProgramType.HIFZ;
}

function parseDateValue(val: unknown): string | null {
  if (!val) return null;
  // Excel stores dates as numbers (serial date)
  if (typeof val === "number") {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  // Attempt ISO or common formats
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // dd/mm/yyyy or mm/dd/yyyy
  const parts = str.split(/[/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // assume dd/mm/yyyy
    if (Number(a) <= 31 && Number(b) <= 12 && c.length === 4) {
      return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
    }
    // yyyy/mm/dd
    if (a.length === 4) {
      return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
    }
  }
  return str;
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const classId = formData.get("classId") as string | null;
    const teacherId = formData.get("teacherId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate class belongs to institute if provided
    let validClassId: string | null = null;
    if (classId) {
      const cls = await prisma.class.findFirst({
        where: { id: classId, instituteId, isActive: true },
        select: { id: true },
      });
      validClassId = cls?.id ?? null;
    }

    // Validate teacher belongs to institute if provided
    let validTeacherId: string | null = null;
    if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, instituteId },
        select: { id: true },
      });
      validTeacherId = teacher?.id ?? null;
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse workbook
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Excel file has no sheets" }, { status: 400 });
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in the Excel file" }, { status: 400 });
    }

    // Normalize column names (case-insensitive, trim)
    const getCol = (row: Record<string, unknown>, ...keys: string[]): string => {
      for (const key of keys) {
        for (const [k, v] of Object.entries(row)) {
          if (k.trim().toLowerCase() === key.toLowerCase()) {
            return String(v ?? "").trim();
          }
        }
      }
      return "";
    };

    const defaultParentPassword = await bcrypt.hash("parent123", 12);
    const defaultStudentPassword = await bcrypt.hash("student123", 12);

    const results: Array<{ row: number; name: string; status: string; error?: string }> = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const rowNum = i + 2; // 1-indexed + header row

      try {
        const fullName = getCol(raw, "Full Name", "fullName", "Name", "Student Name");
        const genderStr = getCol(raw, "Gender", "gender");
        const dobRaw = raw["Date of Birth"] ?? raw["DateOfBirth"] ?? raw["DOB"] ?? raw["dob"] ?? raw["dateofbirth"] ?? "";
        const dateOfBirth = parseDateValue(dobRaw);
        const fatherName = getCol(raw, "Father Name", "fatherName", "Parent Name", "Guardian Name");
        const parentPhone = getCol(raw, "Parent Phone", "parentPhone", "Phone", "Contact");
        const parentEmail = getCol(raw, "Parent Email", "parentEmail", "Email");
        const program = getCol(raw, "Program", "program", "Program Type");
        const city = getCol(raw, "City", "city");
        const address = getCol(raw, "Address", "address");
        const currentJuzStr = getCol(raw, "Current Juz", "currentJuz", "Juz", "Para", "Current Para");
        const feeStr = getCol(raw, "Fee Amount", "feeAmount", "Fee", "Monthly Fee");

        // Validation
        if (!fullName) throw new Error("Full Name is required");
        if (!fatherName) throw new Error("Father/Guardian Name is required");
        if (!parentPhone) throw new Error("Parent Phone is required");
        if (!dateOfBirth) throw new Error("Date of Birth is required or unrecognized format");
        if (!program) throw new Error("Program is required");

        const gender = mapGender(genderStr);
        const programType = mapProgram(program);

        // Count existing students for ID
        const count = await prisma.student.count({ where: { instituteId } });
        const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        const progress = resolveInitialProgress(programType, {
          progressStartType: "NEW",
          currentJuz: currentJuzStr ? parseInt(currentJuzStr) : undefined,
          currentPara: currentJuzStr ? parseInt(currentJuzStr) : undefined,
        });

        await prisma.$transaction(
          async (tx) => {
            const normalizedPhone = normalizePhone(parentPhone);
            const pEmail = parentLoginEmail(parentPhone, parentEmail);

            let parentUser = await tx.user.findFirst({
              where: { OR: [{ phone: normalizedPhone }, { email: pEmail }] },
            });

            if (!parentUser) {
              parentUser = await tx.user.create({
                data: {
                  name: fatherName,
                  email: pEmail,
                  phone: normalizedPhone,
                  password: defaultParentPassword,
                  role: "PARENT",
                  isActive: true,
                  mustChangePassword: true,
                  instituteId,
                  emailVerified: new Date(),
                },
              });
            }

            let parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
            if (!parent) {
              parent = await tx.parent.create({
                data: { relation: "Father", userId: parentUser.id },
              });
            }

            const sEmail = `student.${studentId}@qems.io`;
            const studentUser = await tx.user.create({
              data: {
                name: fullName,
                email: sEmail,
                password: defaultStudentPassword,
                role: "STUDENT",
                isActive: true,
                mustChangePassword: true,
                instituteId,
                emailVerified: new Date(),
              },
            });

            const student = await tx.student.create({
              data: {
                studentId,
                fullName,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                admissionDate: new Date(),
                address: address || null,
                city: city || null,
                country: "PK",
                programType,
                instituteId,
                parentId: parent.id,
                userId: studentUser.id,
                teacherId: validTeacherId || null,
                progressStartType: progress.progressStartType,
                hifzDirection: progress.hifzDirection,
                currentJuz: progress.currentJuz,
                currentPara: progress.currentPara,
                currentSurah: progress.currentSurah,
                currentPage: progress.currentPage,
                emergencyPhone: parentPhone || null,
              },
            });

            // Enroll in class if provided
            if (validClassId) {
              await syncStudentClassEnrollments(tx, student.id, [validClassId]);
            }

            // Create fee if provided
            const feeAmount = feeStr ? parseFloat(feeStr) : null;
            if (feeAmount && feeAmount > 0) {
              await tx.feePayment.create({
                data: {
                  invoiceNo: generateInvoiceNo(),
                  studentId: student.id,
                  amount: feeAmount,
                  discount: 0,
                  netAmount: feeAmount,
                  status: "PENDING",
                  dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10),
                  month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
                },
              });
            }
          },
          { maxWait: 10_000, timeout: 30_000 }
        );

        results.push({ row: rowNum, name: fullName, status: "success" });
        successCount++;
      } catch (err: any) {
        const name = String(rows[i]["Full Name"] ?? rows[i]["Name"] ?? `Row ${rowNum}`);
        results.push({ row: rowNum, name, status: "failed", error: err.message });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      total: rows.length,
      successCount,
      failCount,
      results,
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
