import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markOverdueFees, remindFeeDues } from "@/lib/fee-ops";
import { notifyUser } from "@/lib/notifications";
import { NotificationType, PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAFF = new Set(["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN"]);

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await prisma.feePayment.findMany({
      where: {
        student: { instituteId: session.user.instituteId },
        claimStatus: "CLAIMED",
      },
      include: {
        student: { select: { fullName: true, studentId: true } },
      },
      orderBy: { claimedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      claims: claims.map((c) => ({
        id: c.id,
        invoiceNo: c.invoiceNo,
        studentName: c.student.fullName,
        studentCode: c.student.studentId,
        amount: Number(c.netAmount),
        method: c.claimMethod,
        reference: c.claimReference,
        note: c.claimNote,
        claimedAt: c.claimedAt?.toISOString() ?? null,
        month: c.month,
      })),
    });
  } catch (error) {
    console.error("[FEES_OPS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !STAFF.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const action = (body as { action?: string }).action || "remind";
    const onlyOverdue = Boolean((body as { onlyOverdue?: boolean }).onlyOverdue);
    const feePaymentId = (body as { feePaymentId?: string }).feePaymentId;
    const claimAction = (body as { claimAction?: "VERIFY" | "REJECT" }).claimAction;

    if (action === "resolve-claim" && feePaymentId && claimAction) {
      const payment = await prisma.feePayment.findFirst({
        where: {
          id: feePaymentId,
          student: { instituteId: session.user.instituteId },
          claimStatus: "CLAIMED",
        },
        include: {
          student: {
            select: {
              fullName: true,
              parent: { select: { userId: true } },
            },
          },
        },
      });
      if (!payment) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

      if (claimAction === "VERIFY") {
        await prisma.feePayment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: new Date(),
            paymentMethod: payment.claimMethod,
            claimStatus: "VERIFIED",
          },
        });
      } else {
        await prisma.feePayment.update({
          where: { id: payment.id },
          data: { claimStatus: "REJECTED" },
        });
      }

      if (payment.student.parent?.userId) {
        await notifyUser(payment.student.parent.userId, {
          instituteId: session.user.instituteId,
          type: NotificationType.FEE_CLAIM,
          title:
            claimAction === "VERIFY"
              ? `Payment verified — ${payment.student.fullName}`
              : `Payment claim rejected — ${payment.student.fullName}`,
          message:
            claimAction === "VERIFY"
              ? `Your payment for invoice ${payment.invoiceNo} was verified. JazakAllahu khairan.`
              : `Your payment claim for invoice ${payment.invoiceNo} was not verified.`,
          data: { feePaymentId: payment.id },
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "mark-overdue") {
      const count = await markOverdueFees(session.user.instituteId);
      return NextResponse.json({ success: true, markedOverdue: count });
    }

    if (action === "remind") {
      const overdueFirst = await markOverdueFees(session.user.instituteId);
      const result = await remindFeeDues({
        instituteId: session.user.instituteId,
        onlyOverdue,
      });
      return NextResponse.json({
        success: true,
        markedOverdue: overdueFirst,
        ...result,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[FEES_OPS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
