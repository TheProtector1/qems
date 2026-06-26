import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassIdsByTeacherIds } from "@/lib/teacher-classes";
import {
  computeClassProgressStats,
  getTaskRollupStatus,
  isTaskOverdue,
} from "@/lib/character-task-stats";

export const dynamic = "force-dynamic";

function authorizeInstitute(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (!session?.user?.instituteId) return null;
  const allowed = ["INSTITUTE_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) return null;
  return session.user.instituteId;
}

const taskInclude = {
  assignments: {
    include: {
      teacher: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { students: true } },
        },
      },
    },
  },
  classProgress: {
    include: {
      class: { select: { id: true, name: true, programType: true } },
      teacher: { include: { user: { select: { name: true } } } },
    },
  },
} as const;

export async function GET() {
  try {
    const instituteId = authorizeInstitute(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const [tasks, teachers] = await Promise.all([
      prisma.characterTask.findMany({
        where: { instituteId },
        include: taskInclude,
        orderBy: [{ isActive: "desc" }, { dueDate: "asc" }],
      }),
      prisma.teacher.findMany({
        where: {
          instituteId,
          isActive: true,
          user: { isActive: true },
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { students: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const allTeacherIds = [...new Set(tasks.flatMap((t) => t.assignments.map((a) => a.teacherId)))];
    const classIdsByTeacher = await getClassIdsByTeacherIds(allTeacherIds, instituteId);

    const enrichedTasks = tasks.map((task) => {
      const assignedTeacherIds = task.assignments.map((a) => a.teacherId);
      const expectedClassIds = new Set<string>();
      for (const tid of assignedTeacherIds) {
        for (const cid of classIdsByTeacher.get(tid) || []) {
          expectedClassIds.add(cid);
        }
      }
      const expectedIds = Array.from(expectedClassIds);
      const stats = computeClassProgressStats(expectedIds, task.classProgress);
      const overdue = isTaskOverdue(task.dueDate, task.isActive);
      const rollup = getTaskRollupStatus(stats, task.dueDate, task.isActive);

      return {
        ...task,
        expectedClassCount: expectedIds.length,
        stats,
        overdue,
        rollup,
      };
    });

    const summary = {
      activeTasks: enrichedTasks.filter((t) => t.isActive).length,
      overdueTasks: enrichedTasks.filter((t) => t.overdue && t.isActive).length,
      fullyComplete: enrichedTasks.filter((t) => t.rollup === "DONE").length,
      teachersInvolved: allTeacherIds.length,
      classCompletionRate: (() => {
        const total = enrichedTasks.reduce((s, t) => s + t.stats.total, 0);
        const done = enrichedTasks.reduce((s, t) => s + t.stats.completed, 0);
        return total ? Math.round((done / total) * 100) : 0;
      })(),
    };

    return NextResponse.json({ tasks: enrichedTasks, teachers, summary });
  } catch (error) {
    console.error("[CHARACTER_TASKS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const instituteId = authorizeInstitute(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { title, description, dueDate, category, priority, teacherIds } = body;

    if (!title || !dueDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const validTeacherIds = Array.isArray(teacherIds)
      ? teacherIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      : [];

    if (!validTeacherIds.length) {
      return NextResponse.json({ error: "Select at least one teacher to assign" }, { status: 400 });
    }

    const instituteTeachers = await prisma.teacher.findMany({
      where: { instituteId, id: { in: validTeacherIds }, isActive: true },
      select: { id: true },
    });
    const allowedIds = new Set(instituteTeachers.map((t) => t.id));
    const rejected = validTeacherIds.filter((id) => !allowedIds.has(id));
    if (rejected.length) {
      return NextResponse.json(
        { error: "One or more selected teachers are invalid for this institute" },
        { status: 400 }
      );
    }

    const task = await prisma.characterTask.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        category: category || "AKHLAAQ",
        priority: priority || "NORMAL",
        instituteId,
        assignments: {
          create: validTeacherIds.map((teacherId: string) => ({ teacherId })),
        },
      },
      include: taskInclude,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[CHARACTER_TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
