import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SalaryPayeeType } from "@prisma/client";

export const dynamic = "force-dynamic";

function currentPeriodMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || session.user.role !== "INSTITUTE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const periodMonth = searchParams.get("month") || currentPeriodMonth();

    const [teachers, staff, payments] = await Promise.all([
      prisma.teacher.findMany({
        where: { instituteId, isActive: true },
        include: { user: { select: { name: true, email: true, phone: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      prisma.user.findMany({
        where: { instituteId, role: "STAFF", isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.salaryPayment.findMany({
        where: { instituteId, periodMonth },
      }),
    ]);

    const paymentMap = new Map(
      payments.map((p) => [`${p.payeeType}:${p.payeeId}`, p])
    );

    const employees = [
      ...teachers.map((t) => {
        const key = `TEACHER:${t.id}`;
        const payment = paymentMap.get(key);
        return {
          payeeType: "TEACHER" as const,
          payeeId: t.id,
          name: t.user.name,
          role: "Teacher",
          email: t.user.email,
          phone: t.user.phone,
          monthlySalary: Number(t.salary || 0),
          bankName: t.bankName,
          accountTitle: t.accountTitle,
          accountNumber: t.accountNumber,
          iban: t.iban,
          payment: payment
            ? {
                id: payment.id,
                grossAmount: Number(payment.grossAmount),
                deductions: Number(payment.deductions),
                netAmount: Number(payment.netAmount),
                status: payment.status,
                paidAt: payment.paidAt?.toISOString() || null,
                notes: payment.notes,
              }
            : null,
        };
      }),
      ...staff.map((s) => {
        const key = `STAFF:${s.id}`;
        const payment = paymentMap.get(key);
        return {
          payeeType: "STAFF" as const,
          payeeId: s.id,
          name: s.name,
          role: s.staffRole || "Staff",
          email: s.email,
          phone: s.phone,
          monthlySalary: Number(s.salary || 0),
          bankName: s.bankName,
          accountTitle: s.accountTitle,
          accountNumber: s.accountNumber,
          iban: s.iban,
          payment: payment
            ? {
                id: payment.id,
                grossAmount: Number(payment.grossAmount),
                deductions: Number(payment.deductions),
                netAmount: Number(payment.netAmount),
                status: payment.status,
                paidAt: payment.paidAt?.toISOString() || null,
                notes: payment.notes,
              }
            : null,
        };
      }),
    ];

    const summary = {
      periodMonth,
      totalGross: payments.reduce((s, p) => s + Number(p.grossAmount), 0),
      totalPaid: payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netAmount), 0),
      totalPending: payments.filter((p) => p.status !== "PAID").reduce((s, p) => s + Number(p.netAmount), 0),
      employeeCount: employees.length,
    };

    const history = await prisma.salaryPayment.groupBy({
      by: ["periodMonth"],
      where: { instituteId },
      _sum: { netAmount: true, grossAmount: true },
      _count: true,
      orderBy: { periodMonth: "desc" },
      take: 12,
    });

    return NextResponse.json({
      employees,
      summary,
      history: history.map((h) => ({
        month: h.periodMonth,
        gross: Number(h._sum.grossAmount || 0),
        net: Number(h._sum.netAmount || 0),
        count: h._count,
      })),
    });
  } catch (error) {
    console.error("Get salaries error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || session.user.role !== "INSTITUTE_OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const body = await req.json();
    const {
      payeeType,
      payeeId,
      periodMonth,
      grossAmount,
      deductions,
      status,
      notes,
      bankName,
      accountTitle,
      accountNumber,
      iban,
      monthlySalary,
    } = body;

    if (!payeeType || !payeeId || !periodMonth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const gross = Number(grossAmount ?? monthlySalary ?? 0);
    const ded = Number(deductions || 0);
    const net = Math.max(0, gross - ded);

    if (payeeType === "TEACHER") {
      await prisma.teacher.update({
        where: { id: payeeId, instituteId },
        data: {
          ...(monthlySalary != null ? { salary: monthlySalary } : {}),
          ...(bankName !== undefined ? { bankName } : {}),
          ...(accountTitle !== undefined ? { accountTitle } : {}),
          ...(accountNumber !== undefined ? { accountNumber } : {}),
          ...(iban !== undefined ? { iban } : {}),
        },
      });
    } else if (payeeType === "STAFF") {
      await prisma.user.update({
        where: { id: payeeId, instituteId, role: "STAFF" },
        data: {
          ...(monthlySalary != null ? { salary: monthlySalary } : {}),
          ...(bankName !== undefined ? { bankName } : {}),
          ...(accountTitle !== undefined ? { accountTitle } : {}),
          ...(accountNumber !== undefined ? { accountNumber } : {}),
          ...(iban !== undefined ? { iban } : {}),
        },
      });
    }

    const payment = await prisma.salaryPayment.upsert({
      where: {
        periodMonth_payeeType_payeeId: {
          periodMonth,
          payeeType: payeeType as SalaryPayeeType,
          payeeId,
        },
      },
      create: {
        periodMonth,
        payeeType: payeeType as SalaryPayeeType,
        payeeId,
        teacherId: payeeType === "TEACHER" ? payeeId : null,
        staffUserId: payeeType === "STAFF" ? payeeId : null,
        grossAmount: gross,
        deductions: ded,
        netAmount: net,
        status: status === "PAID" ? "PAID" : "PENDING",
        paidAt: status === "PAID" ? new Date() : null,
        notes: notes || null,
        instituteId,
      },
      update: {
        grossAmount: gross,
        deductions: ded,
        netAmount: net,
        status: status === "PAID" ? "PAID" : "PENDING",
        paidAt: status === "PAID" ? new Date() : null,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Upsert salary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
