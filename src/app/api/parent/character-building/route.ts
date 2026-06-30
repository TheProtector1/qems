import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertParentOwnsStudent } from "@/lib/parent-portal-data";
import { computeClassProgressStats, getTaskRollupStatus, isTaskOverdue } from "@/lib/character-task-stats";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: {
        students: {
          where: studentId ? { id: studentId } : undefined,
          include: {
            enrollments: {
              where: { isActive: true },
              include: { class: { select: { id: true, name: true, programType: true } } },
            },
          },
        },
      },
    });

    if (!parent?.students.length) {
      return NextResponse.json({ students: [], tasks: [], summary: null });
    }

    if (studentId && !(await assertParentOwnsStudent(session.user.id, studentId))) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const studentsPayload = parent.students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      studentId: s.studentId,
      classes: s.enrollments.map((e) => e.class),
    }));

    const instituteId = parent.students[0].instituteId;
    const allClassIds = [
      ...new Set(parent.students.flatMap((s) => s.enrollments.map((e) => e.classId))),
    ];

    const tasks = await prisma.characterTask.findMany({
      where: { instituteId, isActive: true },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        classProgress: allClassIds.length
          ? {
              where: { classId: { in: allClassIds } },
              include: {
                class: { select: { id: true, name: true, programType: true } },
                teacher: { include: { user: { select: { name: true } } } },
              },
            }
          : false,
      },
    });

    const enrichedTasks = tasks.map((task) => {
      const progress = task.classProgress || [];
      const classIds = progress.map((p) => p.classId);
      const stats = computeClassProgressStats(classIds, progress);
      const overdue = isTaskOverdue(task.dueDate, task.isActive);
      const rollup = getTaskRollupStatus(stats, task.dueDate, task.isActive);

      return {
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate.toISOString().slice(0, 10),
        overdue,
        rollup,
        stats,
        classProgress: progress.map((p) => ({
          id: p.id,
          status: p.status,
          notes: p.notes,
          taughtAt: p.taughtAt?.toISOString() ?? null,
          completedAt: p.completedAt?.toISOString() ?? null,
          class: p.class,
          teacherName: p.teacher?.user?.name ?? null,
        })),
      };
    });

    const visibleTasks = enrichedTasks.filter((t) => t.classProgress.length > 0);

    const summary = {
      totalTasks: visibleTasks.length,
      completedTasks: visibleTasks.filter((t) => t.rollup === "DONE").length,
      inProgressTasks: visibleTasks.filter((t) => t.rollup === "IN_PROGRESS" || t.rollup === "PENDING").length,
      overdueTasks: visibleTasks.filter((t) => t.overdue).length,
    };

    return NextResponse.json({
      students: studentsPayload,
      tasks: visibleTasks,
      summary,
    });
  } catch (error) {
    console.error("[PARENT_CHARACTER_BUILDING_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
