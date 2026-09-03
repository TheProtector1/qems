import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Gender, Prisma, ProgramType } from "@prisma/client";
import { normalizePhone, parentLoginEmail } from "@/lib/phone";
import { generateInvoiceNo } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { resolveInitialProgress } from "@/lib/student-progress";
import { sendParentWelcomeEmail } from "@/lib/email";
import { resolveInstituteClassIds, syncStudentClassEnrollments } from "@/lib/student-enrollments";
import { createStudentDocuments, type DocumentInput } from "@/lib/student-documents-server";
import { addDaysToDateKey, parseDateOnly, todayDateKey } from "@/lib/timezone";
import { withDbRetry } from "@/lib/db-retry";

export const dynamic = "force-dynamic";

const PROGRAM_FILTER: Record<string, ProgramType> = {
  Hifz: ProgramType.HIFZ,
  Nazra: ProgramType.NAZRA,
  Tajweed: ProgramType.TAJWEED,
  HIFZ: ProgramType.HIFZ,
  NAZRA: ProgramType.NAZRA,
  TAJWEED: ProgramType.TAJWEED,
};

function clampPageSize(value: string | null) {
  const parsed = Number.parseInt(value || "12", 10);
  if (!Number.isFinite(parsed)) return 12;
  return Math.min(Math.max(parsed, 1), 50);
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    if (!session.user.instituteId && !isSuperAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const pageSize = clampPageSize(searchParams.get("pageSize"));
    const search = searchParams.get("search")?.trim();
    const program = searchParams.get("program")?.trim();
    const className = searchParams.get("class")?.trim();
    const status = searchParams.get("status")?.trim();

    const baseWhere: Prisma.StudentWhereInput = {};
    if (isSuperAdmin && !instituteId) {
      // super admin sees all
    } else {
      baseWhere.instituteId = instituteId!;
    }

    if (session.user.role === "TEACHER" && instituteId) {
      const teacher = await withDbRetry("students.teacherScope", () =>
        prisma.teacher.findFirst({
          where: { userId: session.user.id, instituteId },
        })
      );
      if (teacher) baseWhere.teacherId = teacher.id;
    }

    if (session.user.role === "BRANCH_MANAGER" && session.user.branchId) {
      baseWhere.branchId = session.user.branchId;
    }

    const whereClause: Prisma.StudentWhereInput = { ...baseWhere };

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        {
          parent: {
            user: { name: { contains: search, mode: "insensitive" } },
          },
        },
        {
          parent: {
            user: { email: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    if (program && program !== "All Programs" && PROGRAM_FILTER[program]) {
      whereClause.programType = PROGRAM_FILTER[program];
    }

    if (className && className !== "All Classes") {
      whereClause.enrollments = {
        some: {
          isActive: true,
          class: { name: className },
        },
      };
    }

    if (status && status !== "ALL") {
      if (status === "On Track" || status === "Excellent") whereClause.isActive = true;
      if (status === "Needs Attention" || status === "At Risk") whereClause.isActive = false;
    }

    const select = {
      id: true,
      studentId: true,
      fullName: true,
      gender: true,
      dateOfBirth: true,
      city: true,
      address: true,
      programType: true,
      teacherId: true,
      currentJuz: true,
      currentPara: true,
      hifzDirection: true,
      progressStartType: true,
      previousInstitute: true,
      isActive: true,
      status: true,
      statusReason: true,
      admissionDate: true,
      parent: {
        select: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      teacher: {
        select: {
          user: { select: { name: true } },
        },
      },
      user: { select: { isActive: true } },
      enrollments: {
        where: { isActive: true },
        select: {
          classId: true,
          class: { select: { id: true, name: true, programType: true } },
        },
      },
    } satisfies Prisma.StudentSelect;

    const [students, total, totalStudents, hifzStudents, nazraStudents, inactiveStudents] =
      await withDbRetry("students.pageAndSummary", () =>
        Promise.all([
          prisma.student.findMany({
            where: whereClause,
            select,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          prisma.student.count({ where: whereClause }),
          prisma.student.count({ where: baseWhere }),
          prisma.student.count({ where: { ...baseWhere, programType: ProgramType.HIFZ } }),
          prisma.student.count({ where: { ...baseWhere, programType: ProgramType.NAZRA } }),
          prisma.student.count({ where: { ...baseWhere, isActive: false } }),
        ])
      );

    const since = parseDateOnly(addDaysToDateKey(todayDateKey(), -30));
    const studentIds = students.map((s) => s.id);

    const [attendanceGrouped, hifzRatings] = await Promise.all([
      studentIds.length === 0
        ? Promise.resolve([])
        : withDbRetry("students.attendanceSummary", () =>
            prisma.attendance.groupBy({
              by: ["studentId", "status"],
              where: {
                studentId: { in: studentIds },
                date: { gte: since },
                status: { not: "HOLIDAY" },
              },
              _count: true,
            })
          ),
      studentIds.length === 0
        ? Promise.resolve([])
        : withDbRetry("students.hifzQuality", () =>
            prisma.hifzRecord.groupBy({
              by: ["studentId"],
              where: { studentId: { in: studentIds } },
              _avg: { rating: true },
            })
          ),
    ]);

    const attendancePct: Record<string, number> = {};
    const statsByStudent: Record<string, { present: number; total: number }> = {};
    for (const row of attendanceGrouped) {
      if (!statsByStudent[row.studentId]) {
        statsByStudent[row.studentId] = { present: 0, total: 0 };
      }
      statsByStudent[row.studentId].total += row._count;
      if (row.status === "PRESENT" || row.status === "LATE") {
        statsByStudent[row.studentId].present += row._count;
      }
    }
    for (const [sid, stats] of Object.entries(statsByStudent)) {
      attendancePct[sid] = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
    }

    const qualityScore: Record<string, number> = {};
    for (const row of hifzRatings) {
      if (row._avg.rating) qualityScore[row.studentId] = Number((row._avg.rating * 2).toFixed(1));
    }

    const enriched = students.map((s) => ({
      ...s,
      photo: null as string | null,
      attendancePct: attendancePct[s.id] ?? null,
      qualityScore: qualityScore[s.id] ?? null,
    }));

    return NextResponse.json({
      students: enriched,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      summary: {
        total: totalStudents,
        hifz: hifzStudents,
        nazra: nazraStudents,
        atRisk: inactiveStudents,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;

    const body = await req.json();
    const {
      fullName,
      gender,
      dateOfBirth,
      address,
      city,
      country,
      fatherName,
      parentPhone,
      parentEmail,
      program, // Hifz, Nazra, Tajweed
      teacherId,
      feeAmount,
      scholarshipPct,
      photo,
      progressStartType,
      previousInstitute,
      hifzDirection,
      currentJuz,
      currentPara,
      currentSurah,
      currentPage,
      classIds,
      documents,
    } = body;

    if (!fullName || !gender || !dateOfBirth || !fatherName || !parentPhone || !program) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const count = await prisma.student.count({
      where: { instituteId },
    });
    const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Map string programs to ProgramType enum
    let programType: ProgramType = ProgramType.HIFZ;
    if (program.toUpperCase() === "NAZRA") programType = ProgramType.NAZRA;
    if (program.toUpperCase() === "TAJWEED") programType = ProgramType.TAJWEED;

    // Validate teacher belongs to institute if provided
    let resolvedTeacherId: string | null = null;
    if (teacherId) {
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, instituteId },
      });
      if (teacher) resolvedTeacherId = teacher.id;
    }

    const progress = resolveInitialProgress(programType, {
      progressStartType,
      previousInstitute,
      hifzDirection,
      currentJuz,
      currentPara,
      currentSurah,
      currentPage,
    });

    const [defaultParentPassword, defaultStudentPassword] = await Promise.all([
      bcrypt.hash("parent123", 12),
      bcrypt.hash("student123", 12),
    ]);

    const pendingDocuments = Array.isArray(documents) ? (documents as DocumentInput[]) : [];

    const result = await prisma.$transaction(
      async (tx) => {
      // 1. Check or create parent account (phone-based login)
      const normalizedPhone = normalizePhone(parentPhone);
      const pEmail = parentLoginEmail(parentPhone, parentEmail);

      let parentUser = await tx.user.findFirst({
        where: {
          OR: [{ phone: normalizedPhone }, { email: pEmail }],
        },
      });
      let parentCreatedFresh = false;

      if (!parentUser) {
        parentCreatedFresh = true;
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
      } else {
        parentUser = await tx.user.update({
          where: { id: parentUser.id },
          data: {
            phone: parentUser.phone || normalizedPhone,
            emailVerified: parentUser.emailVerified || new Date(),
            ...(parentEmail?.trim() && !parentUser.email.includes("@parent.qems.local")
              ? {}
              : parentEmail?.trim()
                ? { email: parentEmail.trim().toLowerCase() }
                : {}),
          },
        });
      }

      let parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
      if (!parent) {
        parent = await tx.parent.create({
          data: {
            relation: "Father",
            userId: parentUser.id,
          },
        });
      }

      // 2. Create student user login account
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
          image: photo || null,
          emailVerified: new Date(),
        },
      });

      // 3. Create student profile
      const student = await tx.student.create({
        data: {
          studentId,
          fullName,
          gender: gender as Gender,
          dateOfBirth: new Date(dateOfBirth),
          admissionDate: new Date(),
          address: address || null,
          city: city || null,
          country: country || "PK",
          programType,
          instituteId,
          parentId: parent.id,
          userId: studentUser.id,
          teacherId: resolvedTeacherId ?? undefined,
          photo: photo || null,
          progressStartType: progress.progressStartType,
          previousInstitute: progress.previousInstitute,
          hifzDirection: progress.hifzDirection,
          currentJuz: progress.currentJuz,
          currentPara: progress.currentPara,
          currentSurah: progress.currentSurah,
          currentPage: progress.currentPage,
          emergencyPhone: parentPhone || null,
        },
      });

      // 4. Class enrollments
      const validClassIds = await resolveInstituteClassIds(tx, instituteId, classIds);
      if (validClassIds.length) {
        await syncStudentClassEnrollments(tx, student.id, validClassIds);
      }

      // 5. Create initial fee payment row if feeAmount is present
      if (feeAmount) {
        const fee = parseFloat(feeAmount);
        const discountPct = scholarshipPct ? parseFloat(scholarshipPct) : 0;
        const discountAmount = fee * (discountPct / 100);
        const finalAmount = fee - discountAmount;

        await tx.feePayment.create({
          data: {
            invoiceNo: generateInvoiceNo(),
            studentId: student.id,
            amount: fee,
            discount: discountAmount,
            netAmount: finalAmount,
            status: "PENDING",
            dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10),
            month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
          },
        });
      }

      return { student, pEmail, parentCreatedFresh };
    },
      { maxWait: 10_000, timeout: 30_000 }
    );

    if (pendingDocuments.length) {
      await createStudentDocuments(
        prisma,
        result.student.id,
        pendingDocuments,
        session.user.id
      );
    }

    await createAuditLog({
      entityType: "STUDENT",
      entityId: result.student.id,
      entityLabel: result.student.fullName,
      action: "CREATE",
      details: {
        summary: `Student ${result.student.studentId} enrolled`,
        studentId: result.student.studentId,
        hasPhoto: Boolean(photo),
      },
      performedById: session.user.id,
      performerRole: session.user.role,
      instituteId,
    });

    if (result.parentCreatedFresh) {
      const institute = await prisma.institute.findUnique({
        where: { id: instituteId },
        select: { name: true },
      });
      const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/login`;
      await sendParentWelcomeEmail({
        to: result.pEmail,
        parentName: fatherName,
        studentName: fullName,
        studentId: result.student.studentId,
        instituteName: institute?.name || "Your Institute",
        loginUrl,
        email: result.pEmail,
        temporaryPassword: "parent123",
      });
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      parentPortal: {
        loginUrl: "/auth/login",
        parentEmail: result.pEmail,
        defaultPassword: "parent123",
        note: "Share these credentials with the parent/guardian. If the email already existed, the existing password was kept.",
      },
      studentPortal: {
        email: `student.${result.student.studentId}@qems.io`,
        defaultPassword: "student123",
      },
    });
  } catch (error: any) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
