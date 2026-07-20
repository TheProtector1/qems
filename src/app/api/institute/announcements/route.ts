import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, NotificationType } from "@prisma/client";
import {
  ANNOUNCEMENT_TARGETS,
  announcementTargetLabel,
  resolveAnnouncementRoles,
} from "@/lib/communication";
import { createNotification } from "@/lib/notifications";
import { formatDateTimePK } from "@/lib/timezone";

export const dynamic = "force-dynamic";

const CAN_MANAGE = new Set(["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN", "TEACHER"]);

async function notifyAnnouncementAudience(
  instituteId: string,
  announcementId: string,
  title: string,
  content: string,
  targetRoles: Role[],
  createdById: string
) {
  const users = await prisma.user.findMany({
    where: {
      instituteId,
      isActive: true,
      id: { not: createdById },
      ...(targetRoles.length ? { role: { in: targetRoles } } : {}),
    },
    select: { id: true },
    take: 500,
  });

  await Promise.all(
    users.map((u) =>
      createNotification({
        userId: u.id,
        instituteId,
        type: NotificationType.ANNOUNCEMENT,
        title: `Notice: ${title}`,
        message: content.slice(0, 160),
        data: { announcementId },
      })
    )
  );
}

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
      where: { instituteId: session.user.instituteId },
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
        author: (a.createdById && authorMap.get(a.createdById)) || "Administration",
        isPinned: a.isPinned,
        createdAt: a.createdAt.toISOString(),
      })),
      targets: ANNOUNCEMENT_TARGETS.map(({ value, label }) => ({ value, label })),
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!CAN_MANAGE.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, target, isPinned } = body as {
      title?: string;
      content?: string;
      target?: string;
      isPinned?: boolean;
    };

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const targetRoles = resolveAnnouncementRoles(target);

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        targetRoles,
        isPinned: Boolean(isPinned),
        instituteId: session.user.instituteId,
        createdById: session.user.id,
      },
    });

    // Fire-and-forget audience notifications (don't block publish on notify failures)
    notifyAnnouncementAudience(
      session.user.instituteId,
      announcement.id,
      announcement.title,
      announcement.content,
      targetRoles,
      session.user.id
    ).catch((err) => console.error("[ANNOUNCEMENT_NOTIFY]", err));

    return NextResponse.json({
      success: true,
      announcement: {
        id: announcement.id,
        title: announcement.title,
        target: announcementTargetLabel(announcement.targetRoles),
        content: announcement.content,
        date: formatDateTimePK(announcement.createdAt),
        author: session.user.name || "Administration",
        isPinned: announcement.isPinned,
        createdAt: announcement.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user.instituteId || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!CAN_MANAGE.has(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isPinned } = body as { id?: string; isPinned?: boolean };
    if (!id || typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "id and isPinned are required" }, { status: 400 });
    }

    const existing = await prisma.announcement.findFirst({
      where: { id, instituteId: session.user.instituteId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: { isPinned },
    });

    return NextResponse.json({ success: true, isPinned: updated.isPinned });
  } catch (error) {
    console.error("Patch announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
