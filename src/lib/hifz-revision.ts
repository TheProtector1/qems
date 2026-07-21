import { prisma } from "@/lib/prisma";
import { getSurahName } from "@/lib/utils";
import { addDaysToDateKey, todayDateKey, parseDateOnly } from "@/lib/timezone";

export type RevisionItem = {
  studentId: string;
  studentName: string;
  studentCode: string;
  priority: "critical" | "high" | "medium";
  reason: string;
  suggestedType: "SABQI" | "MANZIL";
  lastLesson: {
    type: string;
    surahName: string;
    ayahFrom: number;
    ayahTo: number;
    rating: number;
    errorCount: number;
    date: string;
  } | null;
  daysSinceSabaq: number | null;
  avgErrors: number;
};

/**
 * Spaced-revision style planner:
 * - Recent sabaq with mistakes → SABQI soon
 * - Old sabaq / low ratings → MANZIL
 * - High error clusters → critical
 */
export async function buildHifzRevisionPlan(opts: {
  instituteId: string;
  teacherId?: string | null;
  limit?: number;
}): Promise<RevisionItem[]> {
  const limit = opts.limit ?? 40;
  const students = await prisma.student.findMany({
    where: {
      instituteId: opts.instituteId,
      isActive: true,
      programType: "HIFZ",
      ...(opts.teacherId ? { teacherId: opts.teacherId } : {}),
    },
    select: {
      id: true,
      fullName: true,
      studentId: true,
      currentPara: true,
      currentJuz: true,
    },
    orderBy: { fullName: "asc" },
    take: 200,
  });

  if (!students.length) return [];

  const since = parseDateOnly(addDaysToDateKey(todayDateKey(), -45));
  const records = await prisma.hifzRecord.findMany({
    where: {
      studentId: { in: students.map((s) => s.id) },
      date: { gte: since },
    },
    select: {
      studentId: true,
      type: true,
      surahNumber: true,
      surahName: true,
      ayahFrom: true,
      ayahTo: true,
      rating: true,
      errorCount: true,
      date: true,
      isRevision: true,
    },
    orderBy: { date: "desc" },
  });

  const byStudent = new Map<string, typeof records>();
  for (const r of records) {
    const list = byStudent.get(r.studentId) || [];
    if (list.length < 20) list.push(r);
    byStudent.set(r.studentId, list);
  }

  const today = todayDateKey();
  const items: RevisionItem[] = [];

  for (const student of students) {
    const hist = byStudent.get(student.id) || [];
    if (!hist.length) {
      items.push({
        studentId: student.id,
        studentName: student.fullName,
        studentCode: student.studentId,
        priority: "medium",
        reason: "No recent lessons logged — start Sabqi from current para",
        suggestedType: "SABQI",
        lastLesson: null,
        daysSinceSabaq: null,
        avgErrors: 0,
      });
      continue;
    }

    const last = hist[0];
    const lastSabaq = hist.find((h) => h.type === "SABAQ") || last;
    const lastKey = lastSabaq.date.toISOString().slice(0, 10);
    const daysSinceSabaq = Math.max(
      0,
      Math.floor(
        (parseDateOnly(today).getTime() - parseDateOnly(lastKey).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const recent = hist.slice(0, 8);
    const avgErrors =
      recent.reduce((s, r) => s + (r.errorCount || 0), 0) / Math.max(1, recent.length);
    const avgRating =
      recent.reduce((s, r) => s + r.rating, 0) / Math.max(1, recent.length);

    let priority: RevisionItem["priority"] = "medium";
    let suggestedType: "SABQI" | "MANZIL" = "SABQI";
    let reason = "Routine revision recommended";

    if (avgErrors >= 4 || avgRating <= 2.5) {
      priority = "critical";
      suggestedType = "SABQI";
      reason = `High mistake density (avg ${avgErrors.toFixed(1)} errors, rating ${avgRating.toFixed(1)}/5)`;
    } else if (daysSinceSabaq <= 2 && (lastSabaq.errorCount || 0) >= 2) {
      priority = "high";
      suggestedType = "SABQI";
      reason = `Fresh sabaq needs Sabqi within 48h (${lastSabaq.errorCount} errors on last lesson)`;
    } else if (daysSinceSabaq >= 7 && daysSinceSabaq < 21) {
      priority = "high";
      suggestedType = "MANZIL";
      reason = `${daysSinceSabaq} days since last sabaq — schedule Manzil`;
    } else if (daysSinceSabaq >= 21) {
      priority = "critical";
      suggestedType = "MANZIL";
      reason = `${daysSinceSabaq} days without new sabaq — urgent Manzil catch-up`;
    } else if (avgRating < 3.5) {
      priority = "high";
      suggestedType = "SABQI";
      reason = `Quality below target (avg rating ${avgRating.toFixed(1)}/5)`;
    }

    items.push({
      studentId: student.id,
      studentName: student.fullName,
      studentCode: student.studentId,
      priority,
      reason,
      suggestedType,
      lastLesson: {
        type: last.type,
        surahName: last.surahName || getSurahName(last.surahNumber),
        ayahFrom: last.ayahFrom,
        ayahTo: last.ayahTo,
        rating: last.rating,
        errorCount: last.errorCount,
        date: lastKey,
      },
      daysSinceSabaq,
      avgErrors: Number(avgErrors.toFixed(1)),
    });
  }

  const rank = { critical: 0, high: 1, medium: 2 };
  return items
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.studentName.localeCompare(b.studentName))
    .slice(0, limit);
}
