import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteCtx) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await ctx.params;
    const sponsor = await prisma.sponsor.findFirst({
      where: { id, instituteId: session.user.instituteId },
      include: { _count: { select: { donations: true } } },
    });

    if (!sponsor) return new NextResponse("Not found", { status: 404 });

    const { getSponsorFundBalance } = await import("@/lib/sponsor-funds");

    const [donationRows, fund, sponsored] = await Promise.all([
      prisma.donation.findMany({
        where: { sponsorId: id },
        orderBy: [{ donationDate: "desc" }, { createdAt: "desc" }],
        take: 20,
        select: {
          id: true,
          amount: true,
          donationDate: true,
          frequency: true,
          category: true,
          status: true,
          paymentMethod: true,
          purpose: true,
          referenceNo: true,
          receivedByName: true,
          receiptData: true,
        },
      }),
      getSponsorFundBalance(session.user.instituteId, id),
      prisma.studentSponsor.findMany({
        where: { sponsorId: id, isActive: true },
        include: {
          student: {
            select: { id: true, fullName: true, studentId: true, programType: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      sponsor: {
        ...sponsor,
        totalDonated: fund.collected,
        totalSpent: fund.spent,
        balance: fund.balance,
        donations: donationRows.map((d) => ({
          id: d.id,
          amount: Number(d.amount),
          donationDate: d.donationDate,
          frequency: d.frequency,
          category: d.category,
          status: d.status,
          paymentMethod: d.paymentMethod,
          purpose: d.purpose,
          referenceNo: d.referenceNo,
          receivedByName: d.receivedByName,
          hasReceipt: Boolean(d.receiptData),
        })),
        sponsoredStudents: sponsored.map((l) => ({
          linkId: l.id,
          id: l.student.id,
          fullName: l.student.fullName,
          studentId: l.student.studentId,
          programType: l.student.programType,
          notes: l.notes,
        })),
      },
    });
  } catch (error) {
    console.error("[SPONSORS_GET_ID]", error);
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
    const sponsor = await prisma.sponsor.update({
      where: { id, instituteId: session.user.instituteId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.organization !== undefined && { organization: body.organization || null }),
        ...(body.profession !== undefined && { profession: body.profession || null }),
        ...(body.employer !== undefined && { employer: body.employer || null }),
        ...(body.city !== undefined && { city: body.city || null }),
        ...(body.cnic !== undefined && { cnic: body.cnic || null }),
        ...(body.photo !== undefined && { photo: body.photo || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error("[SPONSORS_PATCH]", error);
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
    await prisma.sponsor.delete({
      where: { id, instituteId: session.user.instituteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SPONSORS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
