import { prisma } from "@/lib/prisma";
import { ProgramType } from "@prisma/client";
import { getSurahName } from "@/lib/utils";

export async function buildNazraPayload(studentIds: string[], limit = 50) {
  if (!studentIds.length) {
    return { students: [], records: [] };
  }

  const students = await prisma.student.findMany({
    where: { id: { in: studentIds }, isActive: true, programType: ProgramType.NAZRA },
    select: {
      id: true,
      fullName: true,
      currentPara: true,
      currentPage: true,
      currentSurah: true,
    },
    orderBy: { fullName: "asc" },
  });

  const records = await prisma.nazraRecord.findMany({
    where: { studentId: { in: studentIds } },
    include: { student: { select: { fullName: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  const studentSummaries = students.map((s) => {
    const studentRecords = records.filter((r) => r.studentId === s.id);
    const avgFluency =
      studentRecords.length > 0
        ? studentRecords.reduce((sum, r) => sum + r.fluency, 0) / studentRecords.length
        : 0;

    return {
      id: s.id,
      name: s.fullName,
      progress: s.currentPara ? `Para ${s.currentPara}` : s.currentSurah || "Starting",
      qaidaCompleted: (s.currentPage ?? 0) >= 17,
      readingSpeed: avgFluency >= 4 ? "Fast" : avgFluency >= 3 ? "Medium" : "Slow",
      fluency: avgFluency,
    };
  });

  return {
    students: studentSummaries,
    records: records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      student: r.student.fullName,
      surah: r.surahName || getSurahName(r.surahNumber),
      pageFrom: r.pageFrom,
      pageTo: r.pageTo,
      readingAccuracy: Number(r.readingAccuracy),
      tajweedAccuracy: Number(r.tajweedAccuracy),
      fluency: r.fluency,
      teacherNote: r.teacherNote,
      date: r.date.toISOString().slice(0, 10),
      time: r.createdAt.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }),
    })),
  };
}

export async function buildTajweedPayload(studentIds: string[]) {
  if (!studentIds.length) {
    return { students: [], rules: [], evaluations: [] };
  }

  const [students, rules, records] = await Promise.all([
    prisma.student.findMany({
      where: { id: { in: studentIds }, isActive: true, programType: ProgramType.TAJWEED },
      select: { id: true, fullName: true, currentSurah: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.tajweedRule.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
    prisma.tajweedRecord.findMany({
      where: { studentId: { in: studentIds } },
      include: { rule: true },
    }),
  ]);

  const studentSummaries = students.map((s) => {
    const studentRecords = records.filter((r) => r.studentId === s.id);
    const mastered = studentRecords.filter((r) => r.isMastered).length;
    const total = rules.length || 1;
    return {
      id: s.id,
      name: s.fullName,
      progress: s.currentSurah || "Starting",
      masteredCount: mastered,
      totalRules: rules.length,
      masteryPct: Math.round((mastered / total) * 100),
    };
  });

  return {
    students: studentSummaries,
    rules: rules.map((r) => ({
      id: r.id,
      category: r.category,
      ruleName: r.ruleName,
      arabicName: r.arabicName,
      description: r.description,
      order: r.order,
    })),
    evaluations: records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      ruleId: r.ruleId,
      ruleName: r.rule.ruleName,
      category: r.rule.category,
      isMastered: r.isMastered,
      practiceScore: r.practiceScore,
      notes: r.notes,
      masteredAt: r.masteredAt?.toISOString().slice(0, 10) ?? null,
    })),
  };
}
