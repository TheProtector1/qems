import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { getSponsorFundBalance } from "@/lib/sponsor-funds";

export const dynamic = "force-dynamic";

const EDITABLE_STATUSES: PaymentStatus[] = [
  "PENDING",
  "OVERDUE",
  "PARTIAL",
  "PAID",
  "WAIVED",
];

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
    const isOwner =
      session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";
    const resolved = await Promise.resolve(params);
    const body = await req.json();
    const action = (body.action as string) || "collect";

    const existing = await prisma.feePayment.findFirst({
      where: { id: resolved.id, student: { instituteId } },
      include: {
        student: { select: { id: true, fullName: true, studentId: true, programType: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // ── Owner edit of fee record fields ──────────────────────────────
    if (action === "update") {
      if (!isOwner) {
        return NextResponse.json({ error: "Only institute owners can edit fee records" }, { status: 403 });
      }

      const data: Record<string, unknown> = {};

      if (body.amount !== undefined) {
        const amount = Number(body.amount);
        if (!Number.isFinite(amount) || amount < 0) {
          return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }
        data.amount = amount;
      }

      if (body.discount !== undefined) {
        const discount = Number(body.discount);
        if (!Number.isFinite(discount) || discount < 0) {
          return NextResponse.json({ error: "Invalid discount" }, { status: 400 });
        }
        data.discount = discount;
      }

      const nextAmount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount);
      const nextDiscount =
        data.discount !== undefined ? Number(data.discount) : Number(existing.discount);

      if (body.netAmount !== undefined) {
        const net = Number(body.netAmount);
        if (!Number.isFinite(net) || net < 0) {
          return NextResponse.json({ error: "Invalid net amount" }, { status: 400 });
        }
        data.netAmount = net;
      } else if (data.amount !== undefined || data.discount !== undefined) {
        data.netAmount = Math.max(0, nextAmount - nextDiscount);
      }

      if (body.dueDate !== undefined) {
        const due = new Date(body.dueDate);
        if (Number.isNaN(due.getTime())) {
          return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
        }
        data.dueDate = due;
      }

      if (body.month !== undefined) {
        data.month = body.month ? String(body.month) : null;
      }

      if (body.notes !== undefined) {
        data.notes = body.notes ? String(body.notes) : null;
      }

      if (body.status !== undefined) {
        const status = body.status as PaymentStatus;
        if (!EDITABLE_STATUSES.includes(status)) {
          return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        data.status = status;
        if (status === "PAID" && !existing.paidAt && body.paidAt === undefined) {
          data.paidAt = new Date();
        }
        if (status !== "PAID" && status !== "WAIVED" && body.clearPaidAt !== false) {
          data.paidAt = null;
          data.paymentMethod = null;
          data.sponsorId = null;
        }
      }

      if (body.paidAt !== undefined) {
        data.paidAt = body.paidAt ? new Date(body.paidAt) : null;
      }

      if (body.paymentMethod !== undefined) {
        data.paymentMethod = body.paymentMethod || null;
      }

      if (body.sponsorId !== undefined) {
        data.sponsorId = body.sponsorId || null;
      }

      const updated = await prisma.feePayment.update({
        where: { id: resolved.id },
        data,
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
          grossAmount: Number(updated.amount),
          discount: Number(updated.discount),
        },
      });
    }

    // ── Collect payment (mark PAID) ──────────────────────────────────
    if (existing.status === "PAID" || existing.status === "WAIVED") {
      return NextResponse.json({ error: "Invoice already settled" }, { status: 400 });
    }

    const paymentMethod = (body.paymentMethod as PaymentMethod) || "CASH";
    const sponsorId = (body.sponsorId as string | null | undefined) || null;

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
