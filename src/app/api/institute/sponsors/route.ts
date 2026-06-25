import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function authorizeOwner(session: Awaited<ReturnType<typeof getAuthSession>>) {
  if (!session || session.user.role !== "INSTITUTE_OWNER" || !session.user.instituteId) {
    return null;
  }
  return session.user.instituteId;
}

export async function GET() {
  try {
    const instituteId = authorizeOwner(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const sponsors = await prisma.sponsor.findMany({
      where: { instituteId },
      include: {
        donations: {
          where: { status: { in: ["RECEIVED", "PARTIAL"] } },
          select: { amount: true },
        },
        _count: { select: { donations: true } },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    const mapped = sponsors.map((s) => ({
      ...s,
      totalDonated: s.donations.reduce((sum, d) => sum + Number(d.amount), 0),
      donations: undefined,
    }));

    return NextResponse.json({ sponsors: mapped });
  } catch (error) {
    console.error("[SPONSORS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const instituteId = authorizeOwner(await getAuthSession());
    if (!instituteId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, type, email, phone, organization, address, notes } = body;
    if (!name?.trim()) return new NextResponse("Name is required", { status: 400 });

    const sponsor = await prisma.sponsor.create({
      data: {
        name: name.trim(),
        type: type || "INDIVIDUAL",
        email: email || null,
        phone: phone || null,
        organization: organization || null,
        address: address || null,
        notes: notes || null,
        instituteId,
      },
    });

    return NextResponse.json(sponsor);
  } catch (error) {
    console.error("[SPONSORS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
