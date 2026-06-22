import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdmissionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createAuditLog } from "@/lib/audit";
import { sendParentWelcomeEmail } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { stage, notes } = body;

    const application = await prisma.admissionApplication.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.admissionApplication.update({
        where: { id },
        data: {
          status: stage as AdmissionStatus,
          interviewNotes: notes !== undefined ? notes : application.interviewNotes,
        },
      });

      let createdStudent: {
        id: string;
        fullName: string;
        studentId: string;
        parentEmail: string;
        parentName: string;
        parentCreatedFresh: boolean;
      } | null = null;

      if ((stage === "ENROLLED" || stage === "APPROVED") && !application.studentId) {
        // Generate studentId
        const count = await tx.student.count({
          where: { instituteId: session.user.instituteId as string },
        });
        const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        // Create parent user account
        const pEmail = application.parentEmail ? application.parentEmail.toLowerCase() : `parent.${studentId}@qems.io`;
        let parentUser = await tx.user.findUnique({ where: { email: pEmail } });
        let parentCreatedFresh = false;

        if (!parentUser) {
          const defaultPassword = await bcrypt.hash("parent123", 12);
          parentCreatedFresh = true;
          parentUser = await tx.user.create({
            data: {
              name: application.parentName,
              email: pEmail,
              password: defaultPassword,
              role: "PARENT",
              isActive: true,
              mustChangePassword: true,
              instituteId: session.user.instituteId as string,
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

        // Create student login user
        const sEmail = `student.${studentId}@qems.io`;
        const defaultStudentPassword = await bcrypt.hash("student123", 12);
        const studentUser = await tx.user.create({
          data: {
            name: application.applicantName,
            email: sEmail,
            password: defaultStudentPassword,
            role: "STUDENT",
            isActive: true,
            mustChangePassword: true,
            instituteId: session.user.instituteId as string,
            emailVerified: new Date(),
          },
        });

        // Create Student profile
        const student = await tx.student.create({
          data: {
            studentId,
            fullName: application.applicantName,
            gender: application.gender,
            dateOfBirth: application.dateOfBirth,
            admissionDate: new Date(),
            address: application.address,
            programType: application.programType,
            admissionStatus: stage as any,
            instituteId: session.user.instituteId as string,
            parentId: parent.id,
            userId: studentUser.id,
            currentJuz: application.programType === "HIFZ" ? 1 : null,
          },
        });

        // Update application to link the studentId
        await tx.admissionApplication.update({
          where: { id },
          data: { studentId: student.id },
        });

        createdStudent = {
          id: student.id,
          fullName: student.fullName,
          studentId: student.studentId,
          parentEmail: pEmail,
          parentName: application.parentName,
          parentCreatedFresh,
        };
      }

      return { updated, createdStudent };
    });

    if (result.createdStudent) {
      await createAuditLog({
        entityType: "STUDENT",
        entityId: result.createdStudent.id,
        entityLabel: result.createdStudent.fullName,
        action: "CREATE",
        details: {
          summary: `Student ${result.createdStudent.studentId} enrolled from admission application`,
          studentId: result.createdStudent.studentId,
        },
        performedById: session.user.id,
        performerRole: session.user.role,
        instituteId: session.user.instituteId,
      });

      if (result.createdStudent.parentCreatedFresh) {
        const institute = await prisma.institute.findUnique({
          where: { id: session.user.instituteId },
          select: { name: true },
        });
        const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/login`;
        await sendParentWelcomeEmail({
          to: result.createdStudent.parentEmail,
          parentName: result.createdStudent.parentName,
          studentName: result.createdStudent.fullName,
          studentId: result.createdStudent.studentId,
          instituteName: institute?.name || "Your Institute",
          loginUrl,
          email: result.createdStudent.parentEmail,
          temporaryPassword: "parent123",
        });
      }
    }

    return NextResponse.json({ success: true, application: result.updated });
  } catch (error: any) {
    console.error("Update application error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const application = await prisma.admissionApplication.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    await prisma.admissionApplication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Application deleted successfully" });
  } catch (error: any) {
    console.error("Delete application error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
