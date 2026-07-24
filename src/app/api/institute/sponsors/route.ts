import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInstituteSponsorFunds } from "@/lib/sponsor-funds";

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

    const [sponsors, funds] = await Promise.all([
      prisma.sponsor.findMany({
        where: { instituteId },
        include: {
          donations: {
            where: { status: { in: ["RECEIVED", "PARTIAL"] } },
            select: { amount: true },
          },
          feePayments: {
            where: { status: "PAID" },
            select: { netAmount: true },
          },
          _count: {
            select: {
              donations: true,
              sponsoredStudents: { where: { isActive: true } },
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      }),
      getInstituteSponsorFunds(instituteId),
    ]);

    const mapped = sponsors.map((s) => {
      const collected = s.donations.reduce((sum, d) => sum + Number(d.amount), 0);
      const spent = s.feePayments.reduce((sum, p) => sum + Number(p.netAmount), 0);
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        email: s.email,
        phone: s.phone,
        organization: s.organization,
        profession: s.profession,
        employer: s.employer,
        city: s.city,
        cnic: s.cnic,
        photo: s.photo,
        address: s.address,
        notes: s.notes,
        isActive: s.isActive,
        totalDonated: collected,
        totalSpent: spent,
        balance: collected - spent,
        sponsoredStudentCount: s._count.sponsoredStudents,
        _count: { donations: s._count.donations },
      };
    });

    return NextResponse.json({ sponsors: mapped, funds });
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
    const { name, type, email, phone, organization, address, notes, profession, employer, city, cnic, photo } = body;
    if (!name?.trim()) return new NextResponse("Name is required", { status: 400 });

    const sponsor = await prisma.sponsor.create({
      data: {
        name: name.trim(),
        type: type || "INDIVIDUAL",
        email: email || null,
        phone: phone || null,
        organization: organization || null,
        profession: profession || null,
        employer: employer || null,
        city: city || null,
        cnic: cnic || null,
        photo: photo || null,
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
