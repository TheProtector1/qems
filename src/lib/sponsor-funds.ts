import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type SponsorFundBalance = {
  collected: number;
  spent: number;
  balance: number;
  donationCount: number;
  feePaymentCount: number;
  donationSpendCount: number;
};

type Tx = Prisma.TransactionClient | typeof prisma;

/** Sum of received/partial donations for a sponsor (or institute-wide if sponsorId omitted). */
export async function getSponsorCollected(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<{ amount: number; count: number }> {
  const where: Prisma.DonationWhereInput = {
    instituteId,
    status: { in: ["RECEIVED", "PARTIAL"] },
    ...(sponsorId ? { sponsorId } : { sponsorId: { not: null } }),
  };
  const agg = await db.donation.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });
  return {
    amount: Number(agg._sum?.amount || 0),
    count: Number(agg._count),
  };
}

/** Sum of PAID fees attributed to a sponsor (or all sponsored fees if sponsorId omitted). */
export async function getSponsorFeeSpent(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<{ amount: number; count: number }> {
  const where: Prisma.FeePaymentWhereInput = {
    status: "PAID",
    student: { instituteId },
    ...(sponsorId ? { sponsorId } : { sponsorId: { not: null } }),
  };
  const agg = await db.feePayment.aggregate({
    where,
    _sum: { netAmount: true },
    _count: true,
  });
  return {
    amount: Number(agg._sum?.netAmount || 0),
    count: Number(agg._count),
  };
}

/** Sum of donation disbursements for a sponsor's donations (or all named-sponsor spends). */
export async function getSponsorDonationSpent(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<{ amount: number; count: number }> {
  const where: Prisma.DonationSpendWhereInput = {
    instituteId,
    ...(sponsorId
      ? { donation: { sponsorId } }
      : { donation: { sponsorId: { not: null } } }),
  };
  const agg = await db.donationSpend.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  });
  return {
    amount: Number(agg._sum?.amount || 0),
    count: Number(agg._count),
  };
}

/** Total spent = fee payments from fund + donation spends. */
export async function getSponsorSpent(
  instituteId: string,
  sponsorId?: string | null,
  db: Tx = prisma
): Promise<{ amount: number; count: number; feeCount: number; donationSpendCount: number }> {
  const [fees, donationSpends] = await Promise.all([
    getSponsorFeeSpent(instituteId, sponsorId, db),
    getSponsorDonationSpent(instituteId, sponsorId, db),
  ]);
  return {
    amount: fees.amount + donationSpends.amount,
    count: fees.count + donationSpends.count,
    feeCount: fees.count,
    donationSpendCount: donationSpends.count,
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
    feePaymentCount: spent.feeCount,
    donationSpendCount: spent.donationSpendCount,
  };
}

/** Remaining amount on a single donation after spends. */
export async function getDonationRemaining(
  donationId: string,
  donationAmount: number,
  db: Tx = prisma
): Promise<{ spent: number; remaining: number; spendCount: number }> {
  const agg = await db.donationSpend.aggregate({
    where: { donationId },
    _sum: { amount: true },
    _count: true,
  });
  const spent = Number(agg._sum.amount || 0);
  return {
    spent,
    remaining: Math.max(0, donationAmount - spent),
    spendCount: agg._count,
  };
}

/** Institute-wide sponsor fund dashboard figures. */
export async function getInstituteSponsorFunds(instituteId: string) {
  const [fund, unassignedDonations, unassignedSpends, sponsoredStudentCount] = await Promise.all([
    getSponsorFundBalance(instituteId),
    prisma.donation.aggregate({
      where: {
        instituteId,
        sponsorId: null,
        status: { in: ["RECEIVED", "PARTIAL"] },
      },
      _sum: { amount: true },
    }),
    prisma.donationSpend.aggregate({
      where: {
        instituteId,
        donation: { sponsorId: null },
      },
      _sum: { amount: true },
    }),
    prisma.studentSponsor.count({
      where: { isActive: true, student: { instituteId }, sponsor: { isActive: true } },
    }),
  ]);

  const generalCollected = Number(unassignedDonations._sum.amount || 0);
  const generalSpent = Number(unassignedSpends._sum.amount || 0);

  return {
    /** Money received into named sponsor funds */
    collected: fund.collected,
    /** Fees paid from sponsor funds + donation disbursements */
    spent: fund.spent + generalSpent,
    /** Remaining sponsor fund stock */
    balance: fund.balance,
    /** Donations without a linked sponsor (general pot) */
    generalCollected,
    generalSpent,
    generalBalance: generalCollected - generalSpent,
    /** Total inflow = sponsor funds + general donations */
    totalInflow: fund.collected + generalCollected,
    donationCount: fund.donationCount,
    feePaymentCount: fund.feePaymentCount,
    donationSpendCount: fund.donationSpendCount,
    sponsoredStudentCount,
  };
}
