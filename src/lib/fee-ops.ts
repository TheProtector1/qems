import { prisma } from "@/lib/prisma";
import { notifyParentOfStudent } from "@/lib/notifications";
import { NotificationType, PaymentStatus } from "@prisma/client";
import { formatCurrency } from "@/lib/utils";
import { todayDateKey, parseDateOnly } from "@/lib/timezone";

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
