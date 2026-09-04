import { prisma } from "@/lib/prisma";
import { notifyParentOfStudent } from "@/lib/notifications";
import { NotificationType, PaymentStatus, ProgramType } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { todayDateKey, parseDateOnly } from "@/lib/timezone";
import { resolveBaseFeeAmount, computeNetFee } from "@/lib/fee-billing";

export async function markOverdueFees(instituteId: string) {
  const today = parseDateOnly(todayDateKey());
  const result = await prisma.feePayment.updateMany({
    where: {
      student: { instituteId },
      status: PaymentStatus.PENDING,
      dueDate: { lt: today },
    },
    data: { status: PaymentStatus.OVERDUE },
  });
  return result.count;
}

export async function remindFeeDues(opts: {
  instituteId: string;
  onlyOverdue?: boolean;
  limit?: number;
}) {
  const limit = opts.limit ?? 100;
  const payments = await prisma.feePayment.findMany({
    where: {
      student: { instituteId: opts.instituteId, isActive: true },
      status: opts.onlyOverdue
        ? PaymentStatus.OVERDUE
        : { in: [PaymentStatus.PENDING, PaymentStatus.OVERDUE, PaymentStatus.PARTIAL] },
    },
    include: {
      student: { select: { id: true, fullName: true, studentId: true } },
    },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  let sent = 0;
  for (const p of payments) {
    const due = p.dueDate.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    await notifyParentOfStudent(p.studentId, {
      type: NotificationType.FEE_DUE,
      title: p.status === "OVERDUE" ? "Fee overdue" : "Fee reminder",
      message: `${p.student.fullName}: ${formatCurrency(Number(p.netAmount))} due ${due} (${p.month || "invoice"}). Please arrange payment. JazakAllahu khairan.`,
      instituteId: opts.instituteId,
      data: { feePaymentId: p.id, studentId: p.studentId, status: p.status },
    });
    sent += 1;
  }

  return { reminded: sent, payments: payments.length };
}

/**
 * Generate monthly tuition fee vouchers for all active students in an institute.
 * Applies program fee structures, active scholarships, and avoids duplicate billing.
 */
export async function generateMonthlyFeesForInstitute(opts: {
  instituteId: string;
  month?: string;
  dueDay?: number;
  fallbackAmount?: number;
}) {
  const month = opts.month || todayDateKey().slice(0, 7);
  const fallbackAmount = opts.fallbackAmount ?? 5000;
  const dueDay = Math.min(28, Math.max(1, opts.dueDay ?? 10));

  const [y, m] = month.split("-").map(Number);
  const dueDate = new Date(y, m - 1, dueDay);
  const today = parseDateOnly(todayDateKey());

  const [students, feeStructures] = await Promise.all([
    prisma.student.findMany({
      where: {
        instituteId: opts.instituteId,
        isActive: true,
        status: { in: ["ACTIVE", "ON_LEAVE"] },
      },
      select: {
        id: true,
        studentId: true,
        fullName: true,
        programType: true,
        scholarships: {
          where: { isActive: true },
          select: {
            amount: true,
            percentage: true,
            isFullScholarship: true,
            isActive: true,
            startDate: true,
            endDate: true,
          },
        },
        sponsorLinks: {
          where: { isActive: true, sponsor: { isActive: true } },
          select: { sponsorId: true },
        },
      },
    }),
    prisma.feeStructure.findMany({
      where: { instituteId: opts.instituteId, isActive: true },
      select: { programType: true, amount: true },
    }),
  ]);

  const studentIds = students.map((s) => s.id);
  const existing = await prisma.feePayment.findMany({
    where: { studentId: { in: studentIds }, month },
    select: { studentId: true },
  });
  const billedStudentIds = new Set(existing.map((e) => e.studentId));

  const currentCount = await prisma.feePayment.count({
    where: { month, student: { instituteId: opts.instituteId } },
  });

  let seq = currentCount + 1;
  const monthNumStr = month.replace("-", "");
  const toCreate: Array<{
    studentId: string;
    month: string;
    dueDate: Date;
    amount: number;
    discount: number;
    netAmount: number;
    status: PaymentStatus;
    invoiceNo: string;
  }> = [];
  const notifyTargets: Array<{ studentId: string; netAmount: number }> = [];

  for (const student of students) {
    if (billedStudentIds.has(student.id)) continue;

    const baseAmount = resolveBaseFeeAmount(student.programType, feeStructures, fallbackAmount);
    const { amount: gross, discount, netAmount, waived } = computeNetFee(
      baseAmount,
      student.scholarships,
      dueDate
    );

    const status: PaymentStatus = waived
      ? PaymentStatus.WAIVED
      : dueDate < today
      ? PaymentStatus.OVERDUE
      : PaymentStatus.PENDING;

    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNo = `INV-${monthNumStr}-${String(seq).padStart(3, "0")}-${randSuffix}`;
    seq += 1;

    toCreate.push({
      studentId: student.id,
      month,
      dueDate,
      amount: gross,
      discount,
      netAmount,
      status,
      invoiceNo,
    });

    if (!waived) {
      notifyTargets.push({ studentId: student.id, netAmount });
    }
  }

  if (toCreate.length) {
    await prisma.feePayment.createMany({ data: toCreate });
  }

  if (notifyTargets.length) {
    const dueLabel = dueDate.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const [yearNum, monthNum] = month.split("-").map(Number);
    const monthLabel = new Date(yearNum, monthNum - 1, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    void Promise.all(
      notifyTargets.map(({ studentId, netAmount }) =>
        notifyParentOfStudent(studentId, {
          type: NotificationType.FEE_DUE,
          title: "Fee invoice generated",
          message: `Tuition fee for ${monthLabel} is due on ${dueLabel}. Amount: PKR ${netAmount.toLocaleString()}.`,
          data: { studentId, month },
        })
      )
    );
  }

  return {
    month,
    created: toCreate.length,
    alreadyBilled: existing.length,
    totalEligible: students.length,
  };
}

/**
 * Automatically generate monthly fees for all active institutes.
 * Designed to be executed by daily cron on the 1st of every month.
 */
export async function generateMonthlyFeesForActiveInstitutes(opts?: {
  month?: string;
  dueDay?: number;
  fallbackAmount?: number;
}) {
  const institutes = await prisma.institute.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  const results = [];
  for (const inst of institutes) {
    const res = await generateMonthlyFeesForInstitute({
      instituteId: inst.id,
      month: opts?.month,
      dueDay: opts?.dueDay,
      fallbackAmount: opts?.fallbackAmount,
    });
    results.push({ instituteId: inst.id, name: inst.name, ...res });
  }

  return results;
}
