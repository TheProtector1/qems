import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const paymentMethod = (body.paymentMethod as PaymentMethod) || "CASH";

    const existing = await prisma.feePayment.findFirst({
      where: { id: params.id, student: { instituteId: session.user.instituteId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const updated = await prisma.feePayment.update({
      where: { id: params.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod,
      },
      include: {
        student: { select: { fullName: true, studentId: true, programType: true } },
      },
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error) {
    console.error("Update fee payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
