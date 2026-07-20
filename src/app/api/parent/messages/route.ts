import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { roleLabel } from "@/lib/communication";
import { getSticker, type ChatContentType } from "@/lib/chat-enrichment";
import {
  listConversation,
  listThreadsForUser,
  reactToMessage,
  sendMessages,
} from "@/lib/messages-service";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getParentPartners(parentUserId: string, instituteId: string | null | undefined) {
  const map = new Map<string, { id: string; name: string; role: string }>();

  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    select: {
      id: true,
      students: {
        where: { isActive: true },
        select: {
          instituteId: true,
          teacher: {
            select: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  for (const child of parent?.students || []) {
    const teacherUser = child.teacher?.user;
    if (teacherUser) {
      map.set(teacherUser.id, {
        id: teacherUser.id,
        name: teacherUser.name,
        role: "Teacher",
      });
    }
  }

  const instId = instituteId || parent?.students[0]?.instituteId || null;

  if (instId) {
    const staff = await prisma.user.findMany({
      where: {
        instituteId: instId,
        isActive: true,
        id: { not: parentUserId },
        role: { in: [Role.INSTITUTE_OWNER, Role.BRANCH_MANAGER] },
      },
      select: { id: true, name: true, role: true },
      take: 50,
    });
    for (const u of staff) {
      map.set(u.id, { id: u.id, name: u.name, role: roleLabel(u.role) });
    }
  }

  return map;
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const directory = searchParams.get("directory");
    const forStudent = searchParams.get("forStudent");
    const q = searchParams.get("q")?.trim().toLowerCase();
    const after = searchParams.get("after");

    const allowedPartners = await getParentPartners(userId, instituteId);
    const allowedIds = Array.from(allowedPartners.keys());

    if (directory === "1" || forStudent) {
      let contacts = Array.from(allowedPartners.values()).map((p) => ({
        ...p,
        avatar: getInitials(p.name),
      }));
      if (q) {
        contacts = contacts.filter(
          (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ contacts, parent: null });
    }

    if (partnerId) {
      if (!allowedPartners.has(partnerId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const data = await listConversation({
        userId,
        partnerId,
        after,
        markRead: !after,
      });
      return NextResponse.json(data);
    }

    const data = await listThreadsForUser({
      userId,
      partnerIds: allowedIds,
      q: q || undefined,
    });

    const threads = data.threads.map((t) => ({
      ...t,
      role: allowedPartners.get(t.id)?.role || t.role,
    }));

    return NextResponse.json({ threads, unreadTotal: data.unreadTotal });
  } catch (error) {
    console.error("[PARENT_MESSAGES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, receiverIds, content, subject, contentType, stickerId } = body as {
      receiverId?: string;
      receiverIds?: string[];
      content?: string;
      subject?: string;
      contentType?: ChatContentType;
      stickerId?: string;
    };

    const targets = Array.from(
      new Set(
        (Array.isArray(receiverIds) && receiverIds.length
          ? receiverIds
          : receiverId
            ? [receiverId]
            : []
        ).filter(Boolean)
      )
    );

    const partners = await getParentPartners(session.user.id, session.user.instituteId);
    for (const id of targets) {
      if (!partners.has(id)) {
        return NextResponse.json(
          { error: "You can only message your child's teachers or institute leadership" },
          { status: 403 }
        );
      }
    }

    let text = (content || "").trim();
    let type: ChatContentType = contentType || "TEXT";
    let sticker: string | null = stickerId || null;
    if (sticker) {
      const def = getSticker(sticker);
      if (!def) return NextResponse.json({ error: "Unknown sticker" }, { status: 400 });
      type = "STICKER";
      text = def.label;
    }

    if (!targets.length || !text) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    const result = await sendMessages({
      senderId: session.user.id,
      senderName: session.user.name || "Parent",
      instituteId: session.user.instituteId,
      receiverIds: targets,
      content: text,
      subject,
      contentType: type,
      stickerId: sticker,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[PARENT_MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { messageId, emoji } = body as { messageId?: string; emoji?: string };
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji required" }, { status: 400 });
    }
    const result = await reactToMessage({
      userId: session.user.id,
      messageId,
      emoji,
    });
    if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[PARENT_MESSAGES_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
