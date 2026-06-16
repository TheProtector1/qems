import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Gender, ProgramType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      where: { instituteId: session.user.instituteId },
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

    return NextResponse.json({ students });
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
    } = body;

    if (!fullName || !gender || !dateOfBirth || !fatherName || !parentPhone || !program) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const count = await prisma.student.count({
      where: { instituteId: session.user.instituteId },
    });
    const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // Map string programs to ProgramType enum
    let programType = ProgramType.HIFZ;
    if (program.toUpperCase() === "NAZRA") programType = ProgramType.NAZRA;
    if (program.toUpperCase() === "TAJWEED") programType = ProgramType.TAJWEED;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check or create parent account
      const pEmail = parentEmail ? parentEmail.toLowerCase() : `parent.${studentId}@qems.io`;
      let parentUser = await tx.user.findUnique({ where: { email: pEmail } });

      if (!parentUser) {
        const defaultPassword = await bcrypt.hash("parent123", 12);
        parentUser = await tx.user.create({
          data: {
            name: fatherName,
            email: pEmail,
            password: defaultPassword,
            role: "PARENT",
            isActive: true,
            instituteId: session.user.instituteId,
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
          instituteId: session.user.instituteId,
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
          instituteId: session.user.instituteId,
          parentId: parent.id,
          userId: studentUser.id,
          teacherId: teacherId || null,
          currentJuz: programType === ProgramType.HIFZ ? 1 : null,
        },
      });

      // 4. Create initial fee payment row if feeAmount is present
      if (feeAmount) {
        const fee = parseFloat(feeAmount);
        const discount = scholarshipPct ? parseFloat(scholarshipPct) : 0;
        const finalAmount = fee * (1 - discount / 100);

        await tx.feePayment.create({
          data: {
            studentId: student.id,
            amount: finalAmount,
            status: "PENDING",
            dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10), // 10th of next month
            instituteId: session.user.instituteId,
          },
        });
      }

      return student;
    });

    return NextResponse.json({ success: true, student: result });
  } catch (error: any) {
    console.error("Create student error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
