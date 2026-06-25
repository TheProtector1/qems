import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

function targetLabel(roles: Role[]) {
  if (roles.length === 0 || roles.length >= 4) return "All Users";
  return roles.map((r) => r.replace("_", " ")).join(", ");
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== Role.SUPER_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      include: { institute: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        target: a.institute ? `${targetLabel(a.targetRoles)} (${a.institute.name})` : targetLabel(a.targetRoles),
        content: a.content,
        date: a.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        author: "Platform",
      })),
    });
  } catch (error) {
    console.error("Get admin announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
