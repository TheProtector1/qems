import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertParentOwnsStudent } from "@/lib/parent-portal-data";
import { computeClassProgressStats } from "@/lib/character-task-stats";
import { getDuaRollupStatus } from "@/lib/daily-dua";

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
      return NextResponse.json({ students: [], duas: [], summary: null });
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
    const allClassIds = Array.from(
      new Set(parent.students.flatMap((s) => s.enrollments.map((e) => e.classId)))
    );

    const duas = await prisma.dailyDua.findMany({
      where: { instituteId, isActive: true },
      orderBy: [{ createdAt: "desc" }],
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

    const enrichedDuas = duas.map((dua) => {
      const progress = dua.classProgress || [];
      const classIds = progress.map((p) => p.classId);
      const stats = computeClassProgressStats(classIds, progress);
      const rollup = getDuaRollupStatus(stats, dua.isActive);

      return {
        id: dua.id,
        title: dua.title,
        arabicText: dua.arabicText,
        urduTranslation: dua.urduTranslation,
        transliteration: dua.transliteration,
        reference: dua.reference,
        notes: dua.notes,
        category: dua.category,
        priority: dua.priority,
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

    const visibleDuas = enrichedDuas.filter((d) => d.classProgress.length > 0);

    const summary = {
      totalDuas: visibleDuas.length,
      completedDuas: visibleDuas.filter((d) => d.rollup === "DONE").length,
      inProgressDuas: visibleDuas.filter((d) => d.rollup === "IN_PROGRESS" || d.rollup === "PENDING").length,
    };

    return NextResponse.json({
      students: studentsPayload,
      duas: visibleDuas,
      summary,
    });
  } catch (error) {
    console.error("[PARENT_DAILY_DUAS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
