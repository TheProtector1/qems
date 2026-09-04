import { PrismaClient, PaymentStatus, ProgramType } from "@prisma/client";

const prisma = new PrismaClient();

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function resolveBaseFeeAmount(
  programType: ProgramType,
  structures: Array<{ programType: ProgramType | null; amount: any }>,
  fallbackAmount: number
): number {
  const match =
    structures.find((s) => s.programType === programType) ||
    structures.find((s) => s.programType === null);
  if (!match) return fallbackAmount;
  return Number(match.amount);
}

function computeNetFee(
  baseAmount: number,
  scholarships: Array<{
    amount: any;
    percentage: any;
    isFullScholarship: boolean;
    isActive: boolean;
    startDate: Date;
    endDate: Date | null;
  }>,
  asOf: Date = new Date()
): { amount: number; discount: number; netAmount: number; waived: boolean } {
  const active = scholarships.filter((s) => {
    if (!s.isActive) return false;
    if (s.startDate > asOf) return false;
    if (s.endDate && s.endDate < asOf) return false;
    return true;
  });

  if (active.some((s) => s.isFullScholarship)) {
    return { amount: baseAmount, discount: baseAmount, netAmount: 0, waived: true };
  }

  let discount = 0;
  for (const s of active) {
    if (s.percentage != null) {
      discount += (baseAmount * Number(s.percentage)) / 100;
    } else {
      discount += Number(s.amount);
    }
  }
  discount = Math.min(baseAmount, Math.round(discount * 100) / 100);
  const netAmount = Math.max(0, baseAmount - discount);
  return { amount: baseAmount, discount, netAmount, waived: netAmount === 0 };
}

async function main() {
  const month = process.argv[2] || todayDateKey().slice(0, 7);
  console.log(`[QEMS Monthly Fee Generator] Billing month: ${month}`);

  const [y, m] = month.split("-").map(Number);
  const dueDate = new Date(y, m - 1, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const institutes = await prisma.institute.findMany({
    where: { isActive: true },
    include: {
      students: {
        where: {
          isActive: true,
          status: { in: ["ACTIVE", "ON_LEAVE"] },
        },
        include: {
          scholarships: { where: { isActive: true } },
          sponsorLinks: {
            where: { isActive: true, sponsor: { isActive: true } },
            include: { sponsor: { select: { id: true, name: true } } },
          },
        },
      },
      feeStructures: { where: { isActive: true } },
    },
  });

  console.log(`Found ${institutes.length} active institutes.`);
  let totalCreated = 0;

  for (const inst of institutes) {
    if (!inst.students.length) {
      console.log(`- ${inst.name}: 0 active students.`);
      continue;
    }

    const studentIds = inst.students.map((s) => s.id);
    const existing = await prisma.feePayment.findMany({
      where: { studentId: { in: studentIds }, month },
      select: { studentId: true },
    });
    const billedStudentIds = new Set(existing.map((e) => e.studentId));

    const currentCount = await prisma.feePayment.count({
      where: { month, student: { instituteId: inst.id } },
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

    for (const student of inst.students) {
      if (billedStudentIds.has(student.id)) continue;

      const baseAmount = resolveBaseFeeAmount(student.programType, inst.feeStructures, 5000);
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
    }

    if (toCreate.length) {
      await prisma.feePayment.createMany({ data: toCreate });
    }

    totalCreated += toCreate.length;
    console.log(
      `- ${inst.name}: Generated ${toCreate.length} new invoices (${existing.length} already existed out of ${inst.students.length} students)`
    );
  }

  console.log(`\nFee generation complete. Total new vouchers created: ${totalCreated}.\n`);
}

main()
  .catch((err) => {
    console.error("Fee generation error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
