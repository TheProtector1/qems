import { prisma } from "@/lib/prisma";

const PROGRAM_COLORS: Record<string, string> = {
  HIFZ: "#1B5E20",
  NAZRA: "#D4AF37",
  TAJWEED: "#81C784",
  TARBIYAH: "#7C3AED",
  DEFAULT: "#6B7280",
};

export type InstituteAnalytics = {
  kpis: {
    totalStudents: number;
    activeTeachers: number;
    attendanceRate: number;
    qualityScore: number | null;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    hifzCompletions: number;
    totalAlumni: number;
  };
  attendanceTrend: { week: string; rate: number }[];
  attendanceAvg: number;
  programDistribution: { name: string; value: number; color?: string }[];
  hifzProgressData: { month: string; sabaq: number; sabqi: number; manzil: number }[];
  recentStudents: {
    id: string;
    name: string;
    studentId: string;
    program: string;
    admissionDate: string;
  }[];
  alerts: { type: string; message: string; severity: string }[];
};

export async function getInstituteAnalytics(
  instituteId: string,
  branchId?: string | null
): Promise<InstituteAnalytics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const studentScope = {
    instituteId,
    ...(branchId ? { branchId } : {}),
  };

  const [
    totalStudents,
    activeTeachers,
    attendanceByDayStatus,
    hifzAvg,
    feeStats,
    hifzCompletions,
    totalAlumni,
    programGroups,
    recentStudents,
    overdueFees,
    hifzByMonthType,
  ] = await Promise.all([
    prisma.student.count({ where: { ...studentScope, isActive: true } }),
    prisma.teacher.count({
      where: {
        instituteId,
        isActive: true,
        ...(branchId ? { branchId } : {}),
      },
    }),
    prisma.attendance.groupBy({
      by: ["date", "status"],
      where: { student: studentScope, date: { gte: thirtyDaysAgo } },
      _count: true,
    }),
    prisma.hifzRecord.aggregate({
      where: { student: studentScope },
      _avg: { rating: true },
    }),
    prisma.feePayment.groupBy({
      by: ["status"],
      where: { student: studentScope },
      _sum: { netAmount: true },
      _count: true,
    }),
    prisma.student.count({ where: { ...studentScope, hifzCompletedAt: { not: null } } }),
    prisma.instituteAlumni.count({
      where: {
        instituteId,
        ...(branchId ? { student: { branchId } } : {}),
      },
    }),
    prisma.student.groupBy({
      by: ["programType"],
      where: { ...studentScope, isActive: true },
      _count: true,
    }),
    prisma.student.findMany({
      where: { ...studentScope, isActive: true },
      select: {
        id: true,
        fullName: true,
        studentId: true,
        programType: true,
        admissionDate: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.feePayment.count({
      where: {
        student: studentScope,
        status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
        dueDate: { lt: new Date() },
      },
    }),
    branchId
      ? prisma.$queryRaw<Array<{ month: string; type: string; count: bigint }>>`
          SELECT to_char(hr.date, 'YYYY-MM') AS month, hr.type::text AS type, COUNT(*)::bigint AS count
          FROM "HifzRecord" hr
          INNER JOIN "Student" s ON hr."studentId" = s.id
          WHERE s."instituteId" = ${instituteId}
            AND s."branchId" = ${branchId}
            AND hr.date >= ${sixMonthsAgo}
          GROUP BY 1, 2
          ORDER BY 1
        `
      : prisma.$queryRaw<Array<{ month: string; type: string; count: bigint }>>`
          SELECT to_char(hr.date, 'YYYY-MM') AS month, hr.type::text AS type, COUNT(*)::bigint AS count
          FROM "HifzRecord" hr
          INNER JOIN "Student" s ON hr."studentId" = s.id
          WHERE s."instituteId" = ${instituteId} AND hr.date >= ${sixMonthsAgo}
          GROUP BY 1, 2
          ORDER BY 1
        `,
  ]);

  let attTotal = 0;
  let attPresent = 0;
  const weekMap = new Map<string, { present: number; total: number }>();

  for (const row of attendanceByDayStatus) {
    if (row.status === "HOLIDAY") continue;
    const count = row._count;
    attTotal += count;
    if (row.status === "PRESENT" || row.status === "LATE") attPresent += count;

    const d = new Date(row.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekMap.has(key)) weekMap.set(key, { present: 0, total: 0 });
    const entry = weekMap.get(key)!;
    entry.total += count;
    if (row.status === "PRESENT" || row.status === "LATE") entry.present += count;
  }

  const attendanceRate = attTotal ? Math.round((attPresent / attTotal) * 100) : 0;

  const qualityScore = hifzAvg._avg.rating
    ? Number((hifzAvg._avg.rating * 2).toFixed(1))
    : null;

  let totalCollected = 0;
  let totalOutstanding = 0;
  let paidCount = 0;
  let totalFeeRecords = 0;
  for (const row of feeStats) {
    const amt = Number(row._sum.netAmount || 0);
    totalFeeRecords += row._count;
    if (row.status === "PAID") {
      totalCollected += amt;
      paidCount += row._count;
    } else if (["PENDING", "OVERDUE", "PARTIAL"].includes(row.status)) {
      totalOutstanding += amt;
    }
  }
  const collectionRate = totalFeeRecords ? Math.round((paidCount / totalFeeRecords) * 100) : 0;

  const attendanceTrend = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([week, data]) => ({
      week: new Date(week + "T00:00:00").toLocaleDateString("en-PK", {
        month: "short",
        day: "numeric",
      }),
      rate: data.total ? Math.round((data.present / data.total) * 100) : 0,
    }));

  const programDistribution = programGroups.map((g) => ({
    name: g.programType,
    value: g._count,
    color: PROGRAM_COLORS[g.programType] || PROGRAM_COLORS.DEFAULT,
  }));

  const hifzMonthMap = new Map<string, { sabaq: number; sabqi: number; manzil: number }>();
  for (const row of hifzByMonthType) {
    const key = row.month;
    if (!hifzMonthMap.has(key)) hifzMonthMap.set(key, { sabaq: 0, sabqi: 0, manzil: 0 });
    const entry = hifzMonthMap.get(key)!;
    const n = Number(row.count);
    if (row.type === "SABAQ") entry.sabaq += n;
    else if (row.type === "SABQI") entry.sabqi += n;
    else if (row.type === "MANZIL") entry.manzil += n;
  }

  const hifzProgressData = Array.from(hifzMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => {
      const [y, m] = month.split("-").map(Number);
      return {
        month: new Date(y, m - 1, 1).toLocaleDateString("en-PK", { month: "short" }),
        ...data,
      };
    });

  const alerts: InstituteAnalytics["alerts"] = [];
  if (overdueFees > 0) {
    alerts.push({
      type: "fee",
      message: `${overdueFees} fee invoice(s) are overdue`,
      severity: "warning",
    });
  }
  if (attendanceRate < 75 && attTotal > 0) {
    alerts.push({
      type: "attendance",
      message: `Institute attendance is ${attendanceRate}% (last 30 days)`,
      severity: "warning",
    });
  }

  return {
    kpis: {
      totalStudents,
      activeTeachers,
      attendanceRate,
      qualityScore,
      totalCollected,
      totalOutstanding,
      collectionRate,
      hifzCompletions,
      totalAlumni,
    },
    attendanceTrend,
    attendanceAvg: attendanceTrend.length
      ? Math.round(attendanceTrend.reduce((s, w) => s + w.rate, 0) / attendanceTrend.length)
      : attendanceRate,
    programDistribution,
    hifzProgressData,
    recentStudents: recentStudents.map((s) => ({
      id: s.id,
      name: s.fullName,
      studentId: s.studentId,
      program: s.programType,
      admissionDate: s.admissionDate.toISOString().slice(0, 10),
    })),
    alerts,
  };
}
