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
        students: {
          where: { isActive: true },
          select: { id: true, fullName: true, studentId: true, photo: true, gender: true },
          orderBy: { fullName: "asc" },
        },
        user: { select: { name: true } },
      },
    });

    if (!teacher) return new NextResponse("Teacher Not Found", { status: 404 });

    const studentIds = teacher.students.map((s) => s.id);

    const tasks = await prisma.characterTask.findMany({
      where: {
        instituteId: teacher.instituteId,
        isActive: true,
        assignments: { some: { teacherId: teacher.id } },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      include: {
        assignments: {
          where: { teacherId: teacher.id },
          include: {
            teacher: {
              include: { user: { select: { name: true } } },
            },
          },
        },
        progress: {
          where: { studentId: { in: studentIds } },
          include: {
            student: { select: { id: true, fullName: true, studentId: true } },
          },
        },
      },
    });

    const stats = {
      totalTasks: tasks.length,
      pendingStudents: tasks.reduce((acc, t) => {
        const done = t.progress.filter((p) => p.status === "COMPLETED" || p.status === "TAUGHT").length;
        return acc + (studentIds.length - done);
      }, 0),
      completedMarks: tasks.reduce(
        (acc, t) => acc + t.progress.filter((p) => p.status === "COMPLETED").length,
        0
      ),
    };

    return NextResponse.json({ tasks, students: teacher.students, stats, teacherName: teacher.user.name });
  } catch (error) {
    console.error("[TEACHER_CHARACTER_TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
