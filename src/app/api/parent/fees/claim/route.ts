import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { NotificationType, PaymentMethod, PaymentStatus, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feePaymentId, method, reference, note } = body as {
      feePaymentId?: string;
      method?: string;
      reference?: string;
      note?: string;
    };

    if (!feePaymentId || !method) {
      return NextResponse.json({ error: "feePaymentId and method required" }, { status: 400 });
    }

    const payment = await prisma.feePayment.findFirst({
      where: {
        id: feePaymentId,
        student: {
          OR: [
            { parent: { userId: session.user.id } },
            { guardians: { some: { parent: { userId: session.user.id } } } },
          ],
        },
      },
      include: {
        student: {
          select: { id: true, fullName: true, instituteId: true, studentId: true },
        },
      },
    });

    if (!payment) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.WAIVED) {
      return NextResponse.json({ error: "Invoice already settled" }, { status: 400 });
    }
    if (payment.claimStatus === "CLAIMED") {
      return NextResponse.json({ error: "Payment claim already submitted" }, { status: 400 });
    }

    const validMethods = Object.values(PaymentMethod) as string[];
    if (!validMethods.includes(method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    await prisma.feePayment.update({
      where: { id: payment.id },
      data: {
        claimStatus: "CLAIMED",
        claimedAt: new Date(),
        claimMethod: method as PaymentMethod,
        claimReference: reference?.trim() || null,
        claimNote: note?.trim() || null,
      },
    });

    const staff = await prisma.user.findMany({
      where: {
        instituteId: payment.student.instituteId,
        role: { in: [Role.INSTITUTE_OWNER, Role.BRANCH_MANAGER] },
        isActive: true,
      },
      select: { id: true },
      take: 10,
    });

    void Promise.all(
      staff.map((u) =>
        notifyUser(u.id, {
          instituteId: payment.student.instituteId,
          type: NotificationType.FEE_CLAIM,
          title: `Payment claim — ${payment.student.fullName}`,
          message: `${session.user.name || "Parent"} claims ${method} payment for invoice ${payment.invoiceNo}${reference ? ` (ref: ${reference})` : ""}`,
          data: { feePaymentId: payment.id },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PARENT_FEE_CLAIM]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
