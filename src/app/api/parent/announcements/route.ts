import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { announcementTargetLabel } from "@/lib/communication";
import { formatDateTimePK } from "@/lib/timezone";

export const dynamic = "force-dynamic";

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

    const instituteId = session.user.instituteId || parent?.students[0]?.instituteId;
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
      take: 100,
    });

    const authorIds = Array.from(
      new Set(announcements.map((a) => a.createdById).filter(Boolean) as string[])
    );
    const authors = authorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true },
        })
      : [];
    const authorMap = new Map(authors.map((a) => [a.id, a.name]));

    return NextResponse.json({
      announcements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        target: announcementTargetLabel(a.targetRoles),
        content: a.content,
        date: formatDateTimePK(a.createdAt),
        author: (a.createdById && authorMap.get(a.createdById)) || "Institute",
        isPinned: a.isPinned,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[PARENT_ANNOUNCEMENTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
