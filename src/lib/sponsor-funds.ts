import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type SponsorFundBalance = {
  collected: number;
  spent: number;
  balance: number;
  donationCount: number;
  feePaymentCount: number;
};

type Tx = Prisma.TransactionClient | typeof prisma;

/** Sum of received/partial donations for a sponsor (or institute-wide if sponsorId omitted). */
export async function getSponsorCollected(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<{ amount: number; count: number }> {
  const where = {
    instituteId,
    status: { in: ["RECEIVED", "PARTIAL"] as const },
    ...(sponsorId ? { sponsorId } : { sponsorId: { not: null } }),
  };
  const agg = await db.donation.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });
  return {
    amount: Number(agg._sum.amount || 0),
    count: agg._count,
  };
}

/** Sum of PAID fees attributed to a sponsor (or all sponsored fees if sponsorId omitted). */
export async function getSponsorSpent(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<{ amount: number; count: number }> {
  const where = {
    status: "PAID" as const,
    student: { instituteId },
    ...(sponsorId ? { sponsorId } : { sponsorId: { not: null } }),
  };
  const agg = await db.feePayment.aggregate({
    where,
    _sum: { netAmount: true },
    _count: true,
  });
  return {
    amount: Number(agg._sum.netAmount || 0),
    count: agg._count,
  };
}

export async function getSponsorFundBalance(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<SponsorFundBalance> {
  const [collected, spent] = await Promise.all([
    getSponsorCollected(instituteId, sponsorId, db),
    getSponsorSpent(instituteId, sponsorId, db),
  ]);
  return {
    collected: collected.amount,
    spent: spent.amount,
    balance: collected.amount - spent.amount,
    donationCount: collected.count,
    feePaymentCount: spent.count,
  };
}

/** Institute-wide sponsor fund dashboard figures. */
export async function getInstituteSponsorFunds(instituteId: string) {
  const [fund, unassignedDonations, sponsoredStudentCount] = await Promise.all([
    getSponsorFundBalance(instituteId),
    prisma.donation.aggregate({
      where: {
        instituteId,
        sponsorId: null,
        status: { in: ["RECEIVED", "PARTIAL"] },
      },
      _sum: { amount: true },
    }),
    prisma.studentSponsor.count({
      where: { isActive: true, student: { instituteId }, sponsor: { isActive: true } },
    }),
  ]);

  const generalCollected = Number(unassignedDonations._sum.amount || 0);

  return {
    /** Money received into named sponsor funds */
    collected: fund.collected,
    /** Fees paid from sponsor funds */
    spent: fund.spent,
    /** Remaining sponsor fund stock */
    balance: fund.balance,
    /** Donations without a linked sponsor (general pot) */
    generalCollected,
    /** Total inflow = sponsor funds + general donations */
    totalInflow: fund.collected + generalCollected,
    donationCount: fund.donationCount,
    feePaymentCount: fund.feePaymentCount,
    sponsoredStudentCount,
  };
}
