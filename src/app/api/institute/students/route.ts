import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Gender, ProgramType } from "@prisma/client";
import { generateInvoiceNo } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { resolveInitialProgress } from "@/lib/student-progress";
import { sendParentWelcomeEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET() {
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

    const students = await prisma.student.findMany({
      where: isSuperAdmin && !instituteId ? {} : { instituteId: instituteId! },
      include: {
        parent: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const attendanceRows = await prisma.attendance.findMany({
      where: {
        ...(isSuperAdmin && !instituteId ? {} : { student: { instituteId: instituteId! } }),
        date: { gte: since },
      },
      select: { studentId: true, status: true },
    });

    const attendancePct: Record<string, number> = {};
    const attendanceGrouped: Record<string, { present: number; total: number }> = {};
    for (const row of attendanceRows) {
      if (!attendanceGrouped[row.studentId]) {
        attendanceGrouped[row.studentId] = { present: 0, total: 0 };
      }
      attendanceGrouped[row.studentId].total += 1;
      if (row.status === "PRESENT" || row.status === "LATE") {
        attendanceGrouped[row.studentId].present += 1;
      }
    }
    for (const [sid, stats] of Object.entries(attendanceGrouped)) {
      attendancePct[sid] = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
    }

    const hifzRatings = await prisma.hifzRecord.groupBy({
      by: ["studentId"],
      where: isSuperAdmin && !instituteId ? {} : { student: { instituteId: instituteId! } },
      _avg: { rating: true },
    });
    const qualityScore: Record<string, number> = {};
    for (const row of hifzRatings) {
      if (row._avg.rating) qualityScore[row.studentId] = Number((row._avg.rating * 2).toFixed(1));
    }

    const enriched = students.map((s) => ({
      ...s,
      attendancePct: attendancePct[s.id] ?? null,
      qualityScore: qualityScore[s.id] ?? null,
    }));

    return NextResponse.json({ students: enriched });
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
      currentJuz,
      currentPara,
      currentSurah,
      currentPage,
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
      currentJuz,
      currentPara,
      currentSurah,
      currentPage,
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check or create parent account
      const pEmail = parentEmail ? parentEmail.toLowerCase() : `parent.${studentId}@qems.io`;
      let parentUser = await tx.user.findUnique({ where: { email: pEmail } });
      let parentCreatedFresh = false;

      if (!parentUser) {
        const defaultPassword = await bcrypt.hash("parent123", 12);
        parentCreatedFresh = true;
        parentUser = await tx.user.create({
          data: {
            name: fatherName,
            email: pEmail,
            password: defaultPassword,
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
          data: {
            relation: "Father",
            userId: parentUser.id,
          },
        });
      }

      // 2. Create student user login account
      const sEmail = `student.${studentId}@qems.io`;
      const defaultStudentPassword = await bcrypt.hash("student123", 12);
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
          programType,
          instituteId,
          parentId: parent.id,
          userId: studentUser.id,
          teacherId: resolvedTeacherId ?? undefined,
          photo: photo || null,
          progressStartType: progress.progressStartType,
          previousInstitute: progress.previousInstitute,
          currentJuz: progress.currentJuz,
          currentPara: progress.currentPara,
          currentSurah: progress.currentSurah,
          currentPage: progress.currentPage,
          emergencyPhone: parentPhone || null,
        },
      });

      // 4. Create initial fee payment row if feeAmount is present
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
    });

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
