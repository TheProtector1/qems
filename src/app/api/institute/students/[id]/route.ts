import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gender, ProgramType } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
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
      program,
      teacherId,
      currentJuz,
      isActive,
    } = body;

    // Verify student belongs to this institute
    const student = await prisma.student.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Student record
      const studentData: any = {};
      if (fullName) studentData.fullName = fullName;
      if (gender) studentData.gender = gender as Gender;
      if (dateOfBirth) studentData.dateOfBirth = new Date(dateOfBirth);
      if (address !== undefined) studentData.address = address;
      if (city !== undefined) studentData.city = city;
      if (teacherId !== undefined) studentData.teacherId = teacherId || null;
      if (currentJuz !== undefined) studentData.currentJuz = currentJuz ? parseInt(currentJuz) : null;
      if (typeof isActive === "boolean") studentData.isActive = isActive;

      if (program) {
        let programType = ProgramType.HIFZ;
        if (program.toUpperCase() === "NAZRA") programType = ProgramType.NAZRA;
        if (program.toUpperCase() === "TAJWEED") programType = ProgramType.TAJWEED;
        studentData.programType = programType;
      }

      const updatedStudent = await tx.student.update({
        where: { id },
        data: studentData,
      });

      // 2. Update Student's user record if name changed
      if (fullName && student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data: { name: fullName },
        });
      }

      // 3. Update Parent User record if parent details provided
      if (student.parentId && (fatherName || parentEmail)) {
        const parent = await tx.parent.findUnique({
          where: { id: student.parentId },
        });
        if (parent) {
          const parentUserData: any = {};
          if (fatherName) parentUserData.name = fatherName;
          if (parentEmail) parentUserData.email = parentEmail.toLowerCase();
          await tx.user.update({
            where: { id: parent.userId },
            data: parentUserData,
          });
        }
      }

      return updatedStudent;
    });

    return NextResponse.json({ success: true, student: result });
  } catch (error: any) {
    console.error("Update student error:", error);
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

    // Verify student belongs to this institute
    const student = await prisma.student.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete Student's User Login record (cascading cleanup or manually delete)
    if (student.userId) {
      await prisma.user.delete({
        where: { id: student.userId },
      });
    } else {
      // Just delete the student directly
      await prisma.student.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
