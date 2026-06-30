import { ProgramType } from "@prisma/client";

type FeeStructureRow = {
  programType: ProgramType | null;
  amount: { toString(): string } | number;
};

type ScholarshipRow = {
  amount: { toString(): string } | number;
  percentage: { toString(): string } | number | null;
  isFullScholarship: boolean;
  isActive: boolean;
  startDate: Date;
  endDate: Date | null;
};

export function resolveBaseFeeAmount(
  programType: ProgramType,
  structures: FeeStructureRow[],
  fallbackAmount: number
): number {
  const match =
    structures.find((s) => s.programType === programType) ||
    structures.find((s) => s.programType === null);
  if (!match) return fallbackAmount;
  return Number(match.amount);
}

export function computeNetFee(
  baseAmount: number,
  scholarships: ScholarshipRow[],
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
