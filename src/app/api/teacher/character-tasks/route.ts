import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        classes: {
          where: { isActive: true },
          include: { _count: { select: { enrollments: true } } },
          orderBy: { name: "asc" },
        },
        user: { select: { name: true } },
      },
    });

    if (!teacher) return new NextResponse("Teacher Not Found", { status: 404 });

    const classIds = teacher.classes.map((c) => c.id);

    const tasks = await prisma.characterTask.findMany({
      where: {
        instituteId: teacher.instituteId,
        isActive: true,
        assignments: { some: { teacherId: teacher.id } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      include: {
        classProgress: {
          where: { classId: { in: classIds } },
          include: {
            class: { select: { id: true, name: true, programType: true } },
          },
        },
      },
    });

    const stats = {
      totalTasks: tasks.length,
      classesCount: teacher.classes.length,
      completedClasses: tasks.reduce(
        (acc, t) => acc + t.classProgress.filter((p) => p.status === "COMPLETED").length,
        0
      ),
    };

    return NextResponse.json({
      tasks,
      classes: teacher.classes.map((c) => ({
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
