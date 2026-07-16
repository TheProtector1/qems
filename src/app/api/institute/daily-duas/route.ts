import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClassIdsByTeacherIds } from "@/lib/teacher-classes";
import { computeClassProgressStats } from "@/lib/character-task-stats";
import { getDuaRollupStatus } from "@/lib/daily-dua";

export const dynamic = "force-dynamic";

function authorizeInstitute(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (!session?.user?.instituteId) return null;
  const allowed = ["INSTITUTE_OWNER", "SUPER_ADMIN", "BRANCH_MANAGER"];
  if (!allowed.includes(session.user.role)) return null;
  return session.user.instituteId;
}

const duaInclude = {
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

    const [duas, teachers] = await Promise.all([
      prisma.dailyDua.findMany({
        where: { instituteId },
        include: duaInclude,
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
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

    const allTeacherIds = Array.from(new Set(duas.flatMap((d) => d.assignments.map((a) => a.teacherId))));
    const classIdsByTeacher = await getClassIdsByTeacherIds(allTeacherIds, instituteId);

    const enrichedDuas = duas.map((dua) => {
      const assignedTeacherIds = dua.assignments.map((a) => a.teacherId);
      const expectedClassIds = new Set<string>();
      for (const tid of assignedTeacherIds) {
        for (const cid of classIdsByTeacher.get(tid) || []) {
          expectedClassIds.add(cid);
        }
      }
      const expectedIds = Array.from(expectedClassIds);
      const stats = computeClassProgressStats(expectedIds, dua.classProgress);
      const rollup = getDuaRollupStatus(stats, dua.isActive);

      return {
        ...dua,
        expectedClassCount: expectedIds.length,
        stats,
        rollup,
      };
    });

    const summary = {
      activeDuas: enrichedDuas.filter((d) => d.isActive).length,
      fullyComplete: enrichedDuas.filter((d) => d.rollup === "DONE").length,
      teachersInvolved: allTeacherIds.length,
      classCompletionRate: (() => {
        const total = enrichedDuas.reduce((s, d) => s + d.stats.total, 0);
        const done = enrichedDuas.reduce((s, d) => s + d.stats.completed, 0);
        return total ? Math.round((done / total) * 100) : 0;
      })(),
    };

    return NextResponse.json({ duas: enrichedDuas, teachers, summary });
  } catch (error) {
    console.error("[DAILY_DUAS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const instituteId = authorizeInstitute(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const {
      title,
      arabicText,
      urduTranslation,
      transliteration,
      reference,
      notes,
      category,
      priority,
      teacherIds,
    } = body;

    if (!title || !arabicText || !urduTranslation) {
      return NextResponse.json(
        { error: "Title, Arabic text and Urdu translation are required" },
        { status: 400 }
      );
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

    const dua = await prisma.dailyDua.create({
      data: {
        title,
        arabicText,
        urduTranslation,
        transliteration: transliteration || null,
        reference: reference || null,
        notes: notes || null,
        category: category || "DAILY",
        priority: priority || "MEDIUM",
        instituteId,
        assignments: {
          create: validTeacherIds.map((teacherId: string) => ({ teacherId })),
        },
      },
      include: duaInclude,
    });

    return NextResponse.json(dua);
  } catch (error) {
    console.error("[DAILY_DUAS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
