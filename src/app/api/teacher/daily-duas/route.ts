import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherAccessibleClasses } from "@/lib/teacher-classes";
import { computeClassProgressStats } from "@/lib/character-task-stats";
import { getDuaRollupStatus } from "@/lib/daily-dua";

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

    const duas = await prisma.dailyDua.findMany({
      where: {
        instituteId: teacher.instituteId,
        isActive: true,
        assignments: { some: { teacherId: teacher.id } },
      },
      orderBy: [{ createdAt: "desc" }],
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

    const enrichedDuas = duas.map((dua) => {
      const progress = dua.classProgress || [];
      const stats = computeClassProgressStats(classIds, progress);
      const rollup = getDuaRollupStatus(stats, dua.isActive);
      return {
        ...dua,
        classProgress: progress,
        stats,
        rollup,
      };
    });

    const summary = {
      totalDuas: enrichedDuas.length,
      classesCount: teacherClasses.length,
      completedDuas: enrichedDuas.filter((d) => d.rollup === "DONE").length,
      pendingDuas: enrichedDuas.filter((d) => d.rollup === "PENDING" || d.rollup === "IN_PROGRESS").length,
      classSlotsCompleted: enrichedDuas.reduce((s, d) => s + d.stats.completed, 0),
      classSlotsTotal: enrichedDuas.reduce((s, d) => s + d.stats.total, 0),
    };

    return NextResponse.json({
      duas: enrichedDuas,
      classes: teacherClasses,
      summary,
      teacherName: teacher.user.name,
    });
  } catch (error) {
    console.error("[TEACHER_DAILY_DUAS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
