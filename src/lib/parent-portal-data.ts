import { prisma } from "@/lib/prisma";
import { HifzDirection, ProgramType } from "@prisma/client";
import { getCompletedJuzCount, getHifzCompletionPercent } from "@/lib/hifz-progress";

export type ParentChildView = {
  id: string;
  studentId: string;
  fullName: string;
  programType: string;
  className: string;
  teacherName: string;
  currentJuz: number;
  hifzDirection: HifzDirection | null;
  hifzCompletionPct: number;
  qualityScore: number;
  attendancePct: number;
  status: string;
  targetDate: string;
  recentLessons: Array<{
    date: string;
    type: "SABAQ" | "SABQI" | "MANZIL";
    surahNumber: number;
    ayahFrom: number;
    ayahTo: number;
    rating: number;
    teacherNote?: string | null;
  }>;
  achievements: Array<{ icon: string; name: string; date: string; color: string }>;
  radarMetrics: Array<{ subject: string; score: number }>;
};

function buildRadarMetrics(attendancePct: number, qualityScore: number, lessonCount: number) {
  const q = qualityScore > 0 ? Math.min(100, Math.round(qualityScore * 10)) : 0;
  const consistency = lessonCount >= 20 ? 95 : lessonCount >= 10 ? 85 : lessonCount >= 5 ? 70 : lessonCount > 0 ? 55 : 0;
  return [
    { subject: "Accuracy", score: q || attendancePct },
    { subject: "Fluency", score: q },
    { subject: "Retention", score: q ? Math.min(100, q + 5) : 0 },
    { subject: "Attendance", score: attendancePct },
    { subject: "Consistency", score: consistency },
  ];
}

function buildAchievements(
  currentJuz: number | null,
  programType: ProgramType,
  hifzDirection: HifzDirection | null = HifzDirection.REVERSE
) {
  const achievements: ParentChildView["achievements"] = [];
  const dir = hifzDirection ?? HifzDirection.REVERSE;
  if (programType === ProgramType.HIFZ && currentJuz && currentJuz >= 1) {
    const completed = getCompletedJuzCount(dir, currentJuz);
    achievements.push({
      icon: "📖",
      name: `Working on Para ${currentJuz}`,
      date: new Date().toLocaleDateString("en-PK", { month: "short", year: "numeric" }),
      color: "from-green-400 to-emerald-600",
    });
    if (completed >= 5) {
      achievements.push({
        icon: "🏆",
        name: `${completed} Para Completed`,
        date: new Date().toLocaleDateString("en-PK", { month: "short", year: "numeric" }),
        color: "from-yellow-400 to-amber-600",
      });
    }
  }
  return achievements;
}

export async function getParentChildrenViewData(userId: string): Promise<ParentChildView[]> {
  const accessibleIds = await getAccessibleStudentIdsForParent(userId);
  if (!accessibleIds.length) return [];

  const students = await prisma.student.findMany({
    where: { id: { in: accessibleIds }, isActive: true },
    include: {
      enrollments: {
        where: { isActive: true },
        include: { class: true },
      },
      teacher: { include: { user: true } },
      hifzRecords: {
        orderBy: { date: "desc" },
        take: 10,
      },
    },
    orderBy: { fullName: "asc" },
  });

  if (!students.length) return [];

  const studentIds = students.map((s) => s.id);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [attendanceGroups, qualityGroups] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["studentId", "status"],
      where: { studentId: { in: studentIds }, date: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.hifzRecord.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const attendancePct: Record<string, number> = {};
  const attendanceTotals: Record<string, { present: number; total: number }> = {};
  for (const row of attendanceGroups) {
    if (!attendanceTotals[row.studentId]) attendanceTotals[row.studentId] = { present: 0, total: 0 };
    attendanceTotals[row.studentId].total += row._count;
    if (row.status === "PRESENT" || row.status === "LATE") {
      attendanceTotals[row.studentId].present += row._count;
    }
  }
  for (const sid of studentIds) {
    const stats = attendanceTotals[sid];
    attendancePct[sid] = stats?.total ? Math.round((stats.present / stats.total) * 100) : 0;
  }

  const qualityScore: Record<string, number> = {};
  const lessonCounts: Record<string, number> = {};
  for (const row of qualityGroups) {
    if (row._avg.rating) qualityScore[row.studentId] = Number((row._avg.rating * 2).toFixed(1));
    lessonCounts[row.studentId] = row._count;
  }

  return students.map((student) => {
    const activeClass = student.enrollments?.[0]?.class?.name || "Unassigned Class";
    const pct = attendancePct[student.id] ?? 0;
    const quality = qualityScore[student.id] ?? 0;

    const recentLessons = student.hifzRecords.map((rec) => ({
      date: new Date(rec.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
      type: rec.type as "SABAQ" | "SABQI" | "MANZIL",
      surahNumber: rec.surahNumber,
      ayahFrom: rec.ayahFrom,
      ayahTo: rec.ayahTo,
      rating: rec.rating,
      teacherNote: rec.teacherNote,
    }));

    const dir = student.hifzDirection ?? HifzDirection.REVERSE;
    const currentPara = student.currentPara ?? student.currentJuz ?? 1;

    return {
      id: student.id,
      studentId: student.studentId,
      fullName: student.fullName,
      programType: student.programType,
      className: activeClass,
      teacherName: student.teacher?.user.name || "Unassigned Instructor",
      currentJuz: currentPara,
      hifzDirection: student.hifzDirection,
      hifzCompletionPct: getHifzCompletionPercent(dir, currentPara),
      qualityScore: quality,
      attendancePct: pct,
      status: pct >= 90 ? "On Track" : pct >= 75 ? "Needs Attention" : "At Risk",
      targetDate: "—",
      recentLessons,
      achievements: buildAchievements(
        student.currentPara ?? student.currentJuz,
        student.programType,
        student.hifzDirection
      ),
      radarMetrics: buildRadarMetrics(pct, quality, lessonCounts[student.id] ?? 0),
    };
  });
}

export async function getParentRecordId(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    select: { id: true },
  });
  return parent?.id ?? null;
}

/** Students linked as primary parent OR additional guardian */
export async function getAccessibleStudentIdsForParent(userId: string): Promise<string[]> {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    select: {
      id: true,
      students: { select: { id: true } },
      guardianships: { select: { studentId: true } },
    },
  });
  if (!parent) return [];
  const ids = new Set<string>();
  for (const s of parent.students) ids.add(s.id);
  for (const g of parent.guardianships) ids.add(g.studentId);
  return Array.from(ids);
}

export async function getParentChildIds(userId: string): Promise<Array<{ id: string; fullName: string; studentId: string }>> {
  const ids = await getAccessibleStudentIdsForParent(userId);
  if (!ids.length) return [];
  return prisma.student.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, fullName: true, studentId: true },
    orderBy: { fullName: "asc" },
  });
}

export async function assertParentOwnsStudent(userId: string, studentId: string) {
  const ids = await getAccessibleStudentIdsForParent(userId);
  return ids.includes(studentId);
}
