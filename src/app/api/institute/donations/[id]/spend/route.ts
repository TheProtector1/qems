import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DONATION_SPEND_CATEGORIES } from "@/lib/sponsors-donations";
import { getDonationRemaining } from "@/lib/sponsor-funds";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

function parseDateOnly(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const VALID_CATEGORIES = DONATION_SPEND_CATEGORIES.map((c) => c.value) as string[];

export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await ctx.params;
    const donation = await prisma.donation.findFirst({
      where: { id, instituteId: session.user.instituteId },
      select: { id: true },
    });
    if (!donation) return new NextResponse("Not found", { status: 404 });

    const spends = await prisma.donationSpend.findMany({
      where: { donationId: id, instituteId: session.user.instituteId },
      orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      spends: spends.map((s) => ({
        ...s,
        amount: Number(s.amount),
      })),
    });
  } catch (error) {
    console.error("[DONATION_SPENDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const { id } = await ctx.params;
    const body = await req.json();

    const amount = Number(body.amount);
    const reason = String(body.reason || "").trim();
    const place = String(body.place || "").trim();
    const category = String(body.category || "").trim();
    const spentAtRaw = body.spentAt || new Date().toISOString().slice(0, 10);
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }
    if (!place) {
      return NextResponse.json({ error: "Place is required" }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid spend category" }, { status: 400 });
    }

    const donation = await prisma.donation.findFirst({
      where: { id, instituteId },
    });
    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }
    if (donation.status === "CANCELLED" || donation.status === "PLEDGED") {
      return NextResponse.json(
        { error: "Can only spend from received or partial donations" },
        { status: 400 }
      );
    }

    const { remaining } = await getDonationRemaining(id, Number(donation.amount));
    if (amount > remaining + 0.001) {
      return NextResponse.json(
        {
          error: `Insufficient remaining balance. Available ${remaining.toFixed(0)}, requested ${amount.toFixed(0)}.`,
          remaining,
        },
        { status: 400 }
      );
    }

    const spend = await prisma.donationSpend.create({
      data: {
        donationId: id,
        instituteId,
        amount,
        reason,
        place,
        category,
        spentAt: parseDateOnly(spentAtRaw),
        notes,
        recordedById: session.user.id,
      },
    });

    const after = await getDonationRemaining(id, Number(donation.amount));

    return NextResponse.json({
      spend: { ...spend, amount: Number(spend.amount) },
      remaining: after.remaining,
      spentTotal: after.spent,
    });
  } catch (error) {
    console.error("[DONATION_SPEND_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
