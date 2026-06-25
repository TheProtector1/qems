import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [feePayments, donations, staffSalaries, teacherSalaries] = await Promise.all([
      prisma.feePayment.findMany({
        where: { student: { instituteId }, status: "PAID", paidAt: { gte: sixMonthsAgo } },
        select: { netAmount: true, paidAt: true },
      }),
      prisma.donation.findMany({
        where: {
          instituteId,
          status: { in: ["RECEIVED", "PARTIAL"] },
          donationDate: { gte: sixMonthsAgo },
        },
        select: { amount: true, donationDate: true },
      }),
      prisma.user.aggregate({
        where: { instituteId, salary: { not: null }, role: { not: "STUDENT" } },
        _sum: { salary: true },
      }),
      prisma.teacher.aggregate({
        where: { instituteId, salary: { not: null } },
        _sum: { salary: true },
      }),
    ]);

    const monthlyMap = new Map<string, { revenue: number; donations: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap.set(key, { revenue: 0, donations: 0 });
    }

    for (const p of feePayments) {
      if (!p.paidAt) continue;
      const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.revenue += Number(p.netAmount);
      }
    }

    for (const d of donations) {
      const key = `${d.donationDate.getFullYear()}-${String(d.donationDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap.has(key)) {
        monthlyMap.get(key)!.donations += Number(d.amount);
      }
    }

    const monthlySalary =
      Number(staffSalaries._sum.salary || 0) + Number(teacherSalaries._sum.salary || 0);

    const monthlyReports = Array.from(monthlyMap.entries()).map(([key, data]) => {
      const monthIdx = parseInt(key.split("-")[1], 10) - 1;
      const revenue = data.revenue + data.donations;
      const salaries = monthlySalary;
      return {
        month: MONTH_NAMES[monthIdx],
        revenue,
        salaries,
        utilities: 0,
        profit: revenue - salaries,
      };
    });

    const ytdRevenue = monthlyReports.reduce((s, r) => s + r.revenue, 0);
    const ytdExpenses = monthlyReports.reduce((s, r) => s + r.salaries + r.utilities, 0);
    const ytdProfit = ytdRevenue - ytdExpenses;

    const [totalDue, totalPaid] = await Promise.all([
      prisma.feePayment.aggregate({
        where: { student: { instituteId }, createdAt: { gte: yearStart } },
        _sum: { netAmount: true },
      }),
      prisma.feePayment.aggregate({
        where: { student: { instituteId }, status: "PAID", paidAt: { gte: yearStart } },
        _sum: { netAmount: true },
      }),
    ]);

    const collectionEfficiency =
      Number(totalDue._sum.netAmount) > 0
        ? Math.round((Number(totalPaid._sum.netAmount) / Number(totalDue._sum.netAmount)) * 1000) / 10
        : 0;

    return NextResponse.json({
      monthlyReports,
      summary: {
        ytdProfit,
        ytdRevenue,
        ytdExpenses,
        collectionEfficiency,
      },
    });
  } catch (error) {
    console.error("Get finance reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
