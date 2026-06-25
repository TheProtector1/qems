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

    return NextResponse.json({
      branches: branches.map((b) => ({
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
