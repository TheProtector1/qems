import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherAccessibleClasses } from "@/lib/teacher-classes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    // Direct classes assigned to this teacher
    const directClasses = await prisma.class.findMany({
      where: {
        teacherId: teacher.id,
        instituteId: teacher.instituteId,
        isActive: true,
      },
      include: {
        _count: { select: { enrollments: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    });

    // Also include classes where this teacher's students are enrolled
    const teacherStudentIds = await prisma.student.findMany({
      where: {
        teacherId: teacher.id,
        instituteId: teacher.instituteId,
        isActive: true,
      },
      select: { id: true },
    });

    let enrollmentClasses: typeof directClasses = [];
    if (teacherStudentIds.length > 0) {
      enrollmentClasses = await prisma.class.findMany({
        where: {
          instituteId: teacher.instituteId,
          isActive: true,
          enrollments: {
            some: {
              studentId: { in: teacherStudentIds.map((s) => s.id) },
              isActive: true,
            },
          },
        },
        include: {
          _count: { select: { enrollments: { where: { isActive: true } } } },
        },
        orderBy: { name: "asc" },
      });
    }

    const classMap = new Map<string, (typeof directClasses)[number]>();
    for (const cls of [...directClasses, ...enrollmentClasses]) {
      classMap.set(cls.id, cls);
    }
    const teacherClasses = Array.from(classMap.values());
    const classIds = teacherClasses.map((c) => c.id);

    const tasks = await prisma.characterTask.findMany({
      where: {
        instituteId: teacher.instituteId,
        isActive: true,
        assignments: { some: { teacherId: teacher.id } },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignments: {
          where: { teacherId: teacher.id },
          select: { id: true, teacherId: true },
        },
        classProgress: classIds.length
          ? {
              where: { classId: { in: classIds } },
              include: {
                class: { select: { id: true, name: true, programType: true } },
              },
            }
          : false,
      },
    });

    const stats = {
      totalTasks: tasks.length,
      classesCount: teacherClasses.length,
      completedClasses: tasks.reduce(
        (acc, t) => acc + (t.classProgress || []).filter((p) => p.status === "COMPLETED").length,
        0
      ),
    };

    return NextResponse.json({
      tasks,
      classes: teacherClasses.map((c) => ({
        id: c.id,
        name: c.name,
        programType: c.programType,
        studentsCount: c._count.enrollments,
      })),
      stats,
      teacherName: teacher.user.name,
    });
  } catch (error) {
    console.error("[TEACHER_CHARACTER_TASKS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
