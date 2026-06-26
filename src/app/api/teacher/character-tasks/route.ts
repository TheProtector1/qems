import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherAccessibleClasses } from "@/lib/teacher-classes";
import {
  computeClassProgressStats,
  getTaskRollupStatus,
  isTaskOverdue,
} from "@/lib/character-task-stats";

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
      include: { user: { select: { name: true } } },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });
    }

    const teacherClasses = await getTeacherAccessibleClasses(teacher.id, teacher.instituteId);
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
          select: { id: true, assignedAt: true },
        },
        classProgress: classIds.length
          ? {
              where: { classId: { in: classIds }, teacherId: teacher.id },
              include: {
                class: { select: { id: true, name: true, programType: true } },
              },
            }
          : false,
      },
    });

    const enrichedTasks = tasks.map((task) => {
      const progress = task.classProgress || [];
      const stats = computeClassProgressStats(classIds, progress);
      const overdue = isTaskOverdue(task.dueDate, task.isActive);
      const rollup = getTaskRollupStatus(stats, task.dueDate, task.isActive);
      return {
        ...task,
        classProgress: progress,
        stats,
        overdue,
        rollup,
      };
    });

    const summary = {
      totalTasks: enrichedTasks.length,
      classesCount: teacherClasses.length,
      overdueTasks: enrichedTasks.filter((t) => t.rollup === "OVERDUE").length,
      completedTasks: enrichedTasks.filter((t) => t.rollup === "DONE").length,
      pendingTasks: enrichedTasks.filter((t) => t.rollup === "PENDING" || t.rollup === "IN_PROGRESS").length,
      classSlotsCompleted: enrichedTasks.reduce((s, t) => s + t.stats.completed, 0),
      classSlotsTotal: enrichedTasks.reduce((s, t) => s + t.stats.total, 0),
    };

    return NextResponse.json({
      tasks: enrichedTasks,
      classes: teacherClasses,
      summary,
      teacherName: teacher.user.name,
    });
  } catch (error) {
    console.error("[TEACHER_CHARACTER_TASKS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
