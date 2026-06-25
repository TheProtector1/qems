import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatMonthLabel(month: string | null) {
  if (!month) return "—";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function paymentMethodLabel(method: string | null) {
  if (!method) return null;
  return method
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const includeSummary = searchParams.get("summary") === "true";

    const payments = await prisma.feePayment.findMany({
      where: {
        student: { instituteId },
        ...(status && status !== "ALL" ? { status: status as "PAID" | "PENDING" | "OVERDUE" | "WAIVED" | "PARTIAL" } : {}),
      },
      include: {
        student: {
          select: { id: true, fullName: true, studentId: true, programType: true },
        },
      },
      orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
    });

    const fees = payments.map((p) => ({
      id: p.id,
      student: p.student.fullName,
      studentId: p.student.studentId,
      program: p.student.programType,
      month: formatMonthLabel(p.month),
      amount: Number(p.netAmount),
      status: p.status,
      paidAt: p.paidAt ? p.paidAt.toISOString().slice(0, 10) : null,
      method: paymentMethodLabel(p.paymentMethod),
    }));

    let summary = null;
    if (includeSummary) {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const [paid, unpaid, scholarshipCount, monthlyPayments] = await Promise.all([
        prisma.feePayment.aggregate({
          where: { student: { instituteId }, status: "PAID" },
          _sum: { netAmount: true },
        }),
        prisma.feePayment.aggregate({
          where: { student: { instituteId }, status: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
          _sum: { netAmount: true },
        }),
        prisma.scholarship.count({
          where: { student: { instituteId }, isActive: true },
        }),
        prisma.feePayment.findMany({
          where: {
            student: { instituteId },
            createdAt: { gte: sixMonthsAgo },
          },
          select: { month: true, status: true, netAmount: true },
        }),
      ]);

      const trendMap = new Map<string, { collected: number; outstanding: number }>();
      for (const p of monthlyPayments) {
        const key = p.month || "unknown";
        if (!trendMap.has(key)) trendMap.set(key, { collected: 0, outstanding: 0 });
        const entry = trendMap.get(key)!;
        const amt = Number(p.netAmount);
        if (p.status === "PAID") entry.collected += amt;
        else entry.outstanding += amt;
      }

      const revenueData = Array.from(trendMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, data]) => ({
          month: formatMonthLabel(month).split(" ")[0],
          collected: data.collected,
          outstanding: data.outstanding,
        }));

      const totalFees = fees.length;
      const paidCount = fees.filter((f) => f.status === "PAID").length;

      summary = {
        totalCollected: Number(paid._sum.netAmount || 0),
        totalOutstanding: Number(unpaid._sum.netAmount || 0),
        collectionRate: totalFees > 0 ? Math.round((paidCount / totalFees) * 100) : 0,
        scholarshipCount,
        revenueData,
      };
    }

    return NextResponse.json({ fees, summary });
  } catch (error) {
    console.error("Get fees error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
