import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { periodMonthFromDate } from "@/lib/sponsors-donations";

export const dynamic = "force-dynamic";

function parseDateOnly(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function authorizeOwner(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
    return null;
  }
  return session.user.instituteId;
}

export async function GET(req: Request) {
  try {
    const instituteId = authorizeOwner(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const sponsorId = searchParams.get("sponsorId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const frequency = searchParams.get("frequency");
    const includeSummary = searchParams.get("summary") === "true";

    const where: Record<string, unknown> = { instituteId };
    if (sponsorId) where.sponsorId = sponsorId;
    if (category && category !== "ALL") where.category = category;
    if (status && status !== "ALL") where.status = status;
    if (frequency && frequency !== "ALL") where.frequency = frequency;

    if (month && year) {
      where.periodMonth = `${year}-${String(month).padStart(2, "0")}`;
    }

    const donations = await prisma.donation.findMany({
      where,
      include: {
        sponsor: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ donationDate: "desc" }, { createdAt: "desc" }],
    });

    let summary = null;
    if (includeSummary) {
      const now = new Date();
      const currentMonth = periodMonthFromDate(now);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [monthDonations, yearDonations, pledged, sponsorCount, recentByMonth] = await Promise.all([
        prisma.donation.findMany({
          where: { instituteId, periodMonth: currentMonth, status: { in: ["RECEIVED", "PARTIAL"] } },
          select: { amount: true },
        }),
        prisma.donation.findMany({
          where: { instituteId, donationDate: { gte: yearStart }, status: { in: ["RECEIVED", "PARTIAL"] } },
          select: { amount: true },
        }),
        prisma.donation.aggregate({
          where: { instituteId, status: "PLEDGED" },
          _sum: { amount: true },
        }),
        prisma.sponsor.count({ where: { instituteId, isActive: true } }),
        prisma.donation.groupBy({
          by: ["periodMonth"],
          where: {
            instituteId,
            status: { in: ["RECEIVED", "PARTIAL"] },
            periodMonth: { not: null },
            donationDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
          },
          _sum: { amount: true },
          orderBy: { periodMonth: "asc" },
        }),
      ]);

      summary = {
        monthTotal: monthDonations.reduce((s, d) => s + Number(d.amount), 0),
        yearTotal: yearDonations.reduce((s, d) => s + Number(d.amount), 0),
        pledgedTotal: Number(pledged._sum.amount || 0),
        activeSponsors: sponsorCount,
        donationCount: donations.length,
        monthlyTrend: recentByMonth.map((r) => ({
          month: r.periodMonth,
          total: Number(r._sum.amount || 0),
        })),
      };
    }

    return NextResponse.json({
      donations: donations.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        currency: d.currency,
        donationDate: d.donationDate,
        frequency: d.frequency,
        category: d.category,
        status: d.status,
        paymentMethod: d.paymentMethod,
        referenceNo: d.referenceNo,
        purpose: d.purpose,
        notes: d.notes,
        periodMonth: d.periodMonth,
        sponsorId: d.sponsorId,
        sponsor: d.sponsor,
        receivedByName: d.receivedByName,
        hasReceipt: Boolean(d.receiptData),
      })),
      summary,
    });
  } catch (error) {
    console.error("[DONATIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    const instituteId = authorizeOwner(session);
    if (!instituteId || !session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const {
      amount,
      donationDate,
      frequency,
      category,
      status,
      paymentMethod,
      referenceNo,
      purpose,
      notes,
      sponsorId,
      periodMonth,
      receiptData,
      receivedByName,
    } = body;

    if (!amount || !donationDate) {
      return new NextResponse("Amount and date are required", { status: 400 });
    }

    if (sponsorId) {
      const sponsor = await prisma.sponsor.findFirst({
        where: { id: sponsorId, instituteId },
      });
      if (!sponsor) return new NextResponse("Invalid sponsor", { status: 400 });
    }

    const date = parseDateOnly(donationDate);
    const donation = await prisma.donation.create({
      data: {
        amount,
        donationDate: date,
        frequency: frequency || "ONE_TIME",
        category: category || "GENERAL",
        status: status || "RECEIVED",
        paymentMethod: paymentMethod || null,
        referenceNo: referenceNo || null,
        purpose: purpose || null,
        notes: notes || null,
        receiptData: receiptData || null,
        receivedByName: receivedByName?.trim() || null,
        periodMonth: periodMonth || periodMonthFromDate(donationDate),
        sponsorId: sponsorId || null,
        instituteId,
        recordedById: session.user.id,
      },
      include: {
        sponsor: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({
      ...donation,
      amount: Number(donation.amount),
      hasReceipt: Boolean(donation.receiptData),
      receiptData: undefined,
    });
  } catch (error) {
    console.error("[DONATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
