import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

function targetLabel(roles: Role[]) {
  if (roles.length === 0 || roles.length >= 4) return "All";
  return roles.map((r) => r.replace("_", " ")).join(", ");
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { select: { instituteId: true }, take: 1 } },
    });

    const instituteId = parent?.students[0]?.instituteId;
    if (!instituteId) {
      return NextResponse.json({ announcements: [] });
    }

    const announcements = await prisma.announcement.findMany({
      where: {
        instituteId,
        OR: [
          { targetRoles: { isEmpty: true } },
          { targetRoles: { has: Role.PARENT } },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        target: targetLabel(a.targetRoles),
        content: a.content,
        date: a.createdAt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
        author: "Institute",
        isPinned: a.isPinned,
      })),
    });
  } catch (error) {
    console.error("[PARENT_ANNOUNCEMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
