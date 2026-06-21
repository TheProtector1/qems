import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { name, email, qualification, specialization, experience, salary, isActive, image } = body;

    // Verify teacher belongs to the institute
    const teacher = await prisma.teacher.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user record
      const userData: any = {};
      if (name) userData.name = name;
      if (email) userData.email = email.toLowerCase();
      if (typeof isActive === "boolean") userData.isActive = isActive;
      if (image !== undefined) userData.image = image || null;

      await tx.user.update({
        where: { id: teacher.userId },
        data: userData,
      });

      // 2. Update teacher record
      const teacherData: any = {};
      if (qualification !== undefined) teacherData.qualification = qualification;
      if (specialization !== undefined) teacherData.specialization = specialization;
      if (experience !== undefined) teacherData.experience = experience ? parseInt(experience) : null;
      if (salary !== undefined) teacherData.salary = salary ? parseFloat(salary) : null;
      if (typeof isActive === "boolean") teacherData.isActive = isActive;

      const updated = await tx.teacher.update({
        where: { id },
        data: teacherData,
      });

      return updated;
    });

    return NextResponse.json({ success: true, teacher: result });
  } catch (error: any) {
    console.error("Update teacher error:", error);
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

    // Verify teacher belongs to this institute
    const teacher = await prisma.teacher.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Delete associated User (which cascades or we delete both)
    await prisma.user.delete({
      where: { id: teacher.userId },
    });

    return NextResponse.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error: any) {
    console.error("Delete teacher error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
