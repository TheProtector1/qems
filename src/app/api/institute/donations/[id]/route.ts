import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { periodMonthFromDate } from "@/lib/sponsors-donations";

type RouteCtx = { params: Promise<{ id: string }> };

function parseDateOnly(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await ctx.params;
    const donation = await prisma.donation.findFirst({
      where: { id, instituteId: session.user.instituteId },
      include: { sponsor: { select: { id: true, name: true, type: true } } },
    });

    if (!donation) return new NextResponse("Not found", { status: 404 });

    return NextResponse.json({
      donation: {
        ...donation,
        amount: Number(donation.amount),
        hasReceipt: Boolean(donation.receiptData),
      },
    });
  } catch (error) {
    console.error("[DONATIONS_GET_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await ctx.params;
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (body.amount !== undefined) data.amount = body.amount;
    if (body.donationDate !== undefined) {
      data.donationDate = parseDateOnly(body.donationDate);
      data.periodMonth = body.periodMonth || periodMonthFromDate(body.donationDate);
    }
    if (body.frequency !== undefined) data.frequency = body.frequency;
    if (body.category !== undefined) data.category = body.category;
    if (body.status !== undefined) data.status = body.status;
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null;
    if (body.referenceNo !== undefined) data.referenceNo = body.referenceNo || null;
    if (body.purpose !== undefined) data.purpose = body.purpose || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.sponsorId !== undefined) data.sponsorId = body.sponsorId || null;
    if (body.periodMonth !== undefined) data.periodMonth = body.periodMonth;
    if (body.receiptData !== undefined) data.receiptData = body.receiptData || null;
    if (body.receivedByName !== undefined) data.receivedByName = body.receivedByName?.trim() || null;

    const donation = await prisma.donation.update({
      where: { id, instituteId: session.user.instituteId },
      data,
      include: { sponsor: { select: { id: true, name: true, type: true } } },
    });

    return NextResponse.json({
      ...donation,
      amount: Number(donation.amount),
      hasReceipt: Boolean(donation.receiptData),
      receiptData: undefined,
    });
  } catch (error) {
    console.error("[DONATIONS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await ctx.params;
    await prisma.donation.delete({
      where: { id, instituteId: session.user.instituteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DONATIONS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
