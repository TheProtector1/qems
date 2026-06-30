import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: { instituteId: session.user.instituteId },
      include: {
        _count: { select: { students: true, teachers: true } },
        managers: { select: { name: true }, take: 1 },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ branches: branches.map((b) => ({
        id: b.id,
        name: b.name,
        manager: b.managers[0]?.name || "—",
        studentsCount: b._count.students,
        teachersCount: b._count.teachers,
        phone: b.phone || "—",
        email: b.email || "—",
        status: b.isActive ? "ACTIVE" : "INACTIVE",
      })),
    });
  } catch (error) {
    console.error("Get branches error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["INSTITUTE_OWNER", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, address, city, phone, email } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: name.trim(),
        code: code?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        instituteId: session.user.instituteId,
      },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    console.error("Create branch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
