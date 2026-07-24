import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";
import { getSponsorFundBalance } from "@/lib/sponsor-funds";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instituteId = session.user.instituteId;
    const resolved = await Promise.resolve(params);
    const body = await req.json();
    const paymentMethod = (body.paymentMethod as PaymentMethod) || "CASH";
    const sponsorId = (body.sponsorId as string | null | undefined) || null;

    const existing = await prisma.feePayment.findFirst({
      where: { id: resolved.id, student: { instituteId } },
      include: {
        student: { select: { id: true, fullName: true, studentId: true, programType: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (existing.status === "PAID" || existing.status === "WAIVED") {
      return NextResponse.json({ error: "Invoice already settled" }, { status: 400 });
    }

    let resolvedMethod = paymentMethod;
    let resolvedSponsorId: string | null = null;

    if (sponsorId) {
      const link = await prisma.studentSponsor.findFirst({
        where: {
          studentId: existing.studentId,
          sponsorId,
          isActive: true,
          sponsor: { instituteId, isActive: true },
        },
        include: { sponsor: { select: { id: true, name: true } } },
      });

      if (!link) {
        return NextResponse.json(
          { error: "Selected sponsor is not linked to this student" },
          { status: 400 }
        );
      }

      const fund = await getSponsorFundBalance(instituteId, sponsorId);
      const due = Number(existing.netAmount);
      if (fund.balance + 0.001 < due) {
        return NextResponse.json(
          {
            error: `Insufficient sponsor balance. Available ${fund.balance.toFixed(0)}, invoice needs ${due.toFixed(0)}.`,
            balance: fund.balance,
          },
          { status: 400 }
        );
      }

      resolvedSponsorId = sponsorId;
      resolvedMethod = "SCHOLARSHIP";
    }

    const updated = await prisma.feePayment.update({
      where: { id: resolved.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: resolvedMethod,
        sponsorId: resolvedSponsorId,
      },
      include: {
        student: { select: { fullName: true, studentId: true, programType: true } },
        sponsor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        ...updated,
        amount: Number(updated.netAmount),
      },
    });
  } catch (error) {
    console.error("Update fee payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
