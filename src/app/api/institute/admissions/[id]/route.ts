import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdmissionStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

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
      // Update application stage
      const updated = await tx.admissionApplication.update({
        where: { id },
        data: {
<<<<<<< HEAD
          status: stage as AdmissionStatus,
          interviewNotes: notes !== undefined ? notes : application.interviewNotes,
=======
          stage: stage as AdmissionStatus,
          notes: notes !== undefined ? notes : application.notes,
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
        },
      });

      // If approved or enrolled and not yet registered as a student, create the student!
      if ((stage === "ENROLLED" || stage === "APPROVED") && !application.studentId) {
        // Generate studentId
        const count = await tx.student.count({
          where: { instituteId: session.user.instituteId },
        });
        const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

        // Create parent user account
        const pEmail = application.parentEmail ? application.parentEmail.toLowerCase() : `parent.${studentId}@qems.io`;
        let parentUser = await tx.user.findUnique({ where: { email: pEmail } });

        if (!parentUser) {
          const defaultPassword = await bcrypt.hash("parent123", 12);
          parentUser = await tx.user.create({
            data: {
              name: application.parentName,
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
            instituteId: session.user.instituteId,
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
<<<<<<< HEAD
            programType: application.programType,
=======
            city: application.city,
            programType: application.program,
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
            admissionStatus: stage as any,
            instituteId: session.user.instituteId,
            parentId: parent.id,
            userId: studentUser.id,
<<<<<<< HEAD
            currentJuz: application.programType === "HIFZ" ? 1 : null,
=======
            currentJuz: application.program === "HIFZ" ? 1 : null,
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
          },
        });

        // Update application to link the studentId
        await tx.admissionApplication.update({
          where: { id },
          data: { studentId: student.id },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, application: result });
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
