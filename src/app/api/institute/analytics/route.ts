import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalStudents,
      activeTeachers,
      attendanceRows,
      hifzAvg,
      feeStats,
      hifzCompletions,
      programGroups,
      recentStudents,
      overdueFees,
      hifzRecords,
    ] = await Promise.all([
      prisma.student.count({ where: { instituteId, isActive: true } }),
      prisma.teacher.count({ where: { instituteId, isActive: true } }),
      prisma.attendance.findMany({
        where: { student: { instituteId }, date: { gte: thirtyDaysAgo } },
        select: { status: true, date: true },
      }),
      prisma.hifzRecord.aggregate({
        where: { student: { instituteId } },
        _avg: { rating: true },
      }),
      prisma.feePayment.groupBy({
        by: ["status"],
        where: { student: { instituteId } },
        _sum: { netAmount: true },
        _count: true,
      }),
      prisma.student.count({ where: { instituteId, hifzCompletedAt: { not: null } } }),
      prisma.student.groupBy({
        by: ["programType"],
        where: { instituteId, isActive: true },
        _count: true,
      }),
      prisma.student.findMany({
        where: { instituteId, isActive: true },
        select: { id: true, fullName: true, studentId: true, programType: true, admissionDate: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.feePayment.count({
        where: {
          student: { instituteId },
          status: { in: ["PENDING", "OVERDUE", "PARTIAL"] },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.hifzRecord.findMany({
        where: { student: { instituteId }, date: { gte: sixMonthsAgo } },
        select: { type: true, date: true },
      }),
    ]);

    const attTotal = attendanceRows.filter((r) => r.status !== "HOLIDAY").length;
    const attPresent = attendanceRows.filter((r) =>
      ["PRESENT", "LATE"].includes(r.status)
    ).length;
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

    const weekMap = new Map<string, { present: number; total: number }>();
    for (const row of attendanceRows) {
      if (row.status === "HOLIDAY") continue;
      const d = new Date(row.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weekMap.has(key)) weekMap.set(key, { present: 0, total: 0 });
      const entry = weekMap.get(key)!;
      entry.total += 1;
      if (row.status === "PRESENT" || row.status === "LATE") entry.present += 1;
    }

    const attendanceTrend = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([week, data]) => ({
        week: new Date(week + "T00:00:00").toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
        rate: data.total ? Math.round((data.present / data.total) * 100) : 0,
      }));

    const PROGRAM_COLORS: Record<string, string> = {
      HIFZ: "#1B5E20",
      NAZRA: "#D4AF37",
      TAJWEED: "#81C784",
      TARBIYAH: "#7C3AED",
      DEFAULT: "#6B7280",
    };

    const programDistribution = programGroups.map((g) => ({
      name: g.programType,
      value: g._count,
      color: PROGRAM_COLORS[g.programType] || PROGRAM_COLORS.DEFAULT,
    }));

    const hifzMonthMap = new Map<string, { sabaq: number; sabqi: number; manzil: number }>();
    for (const rec of hifzRecords) {
      const key = rec.date.toISOString().slice(0, 7);
      if (!hifzMonthMap.has(key)) hifzMonthMap.set(key, { sabaq: 0, sabqi: 0, manzil: 0 });
      const entry = hifzMonthMap.get(key)!;
      if (rec.type === "SABAQ") entry.sabaq += 1;
      else if (rec.type === "SABQI") entry.sabqi += 1;
      else if (rec.type === "MANZIL") entry.manzil += 1;
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

    const alerts: Array<{ type: string; message: string; severity: string }> = [];
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

    return NextResponse.json({
      kpis: {
        totalStudents,
        activeTeachers,
        attendanceRate,
        qualityScore,
        totalCollected,
        totalOutstanding,
        collectionRate,
        hifzCompletions,
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
    });
  } catch (error) {
    console.error("[INSTITUTE_ANALYTICS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
