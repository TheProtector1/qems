import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { roleLabel } from "@/lib/communication";
import { getSticker, type ChatContentType } from "@/lib/chat-enrichment";
import {
  listConversation,
  listThreadsForUser,
  sendMessages,
} from "@/lib/messages-service";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAFF_ROLES: Role[] = [
  Role.INSTITUTE_OWNER,
  Role.BRANCH_MANAGER,
  Role.SUPER_ADMIN,
];

function canUseInstituteMessages(role: string) {
  return STAFF_ROLES.includes(role as Role) || role === Role.TEACHER;
}

async function getInstituteDirectory(instituteId: string, currentUserId: string, q?: string) {
  const users = await prisma.user.findMany({
    where: {
      instituteId,
      isActive: true,
      id: { not: currentUserId },
      role: { in: [Role.TEACHER, Role.PARENT, Role.BRANCH_MANAGER, Role.INSTITUTE_OWNER, Role.STAFF] },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, role: true, email: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 100,
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    role: roleLabel(u.role),
    roleRaw: u.role,
    email: u.email,
    avatar: getInitials(u.name),
  }));
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canUseInstituteMessages(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const instituteId = session.user.instituteId;
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");
    const directory = searchParams.get("directory");
    const forStudent = searchParams.get("forStudent");
    const q = searchParams.get("q")?.trim();
    const after = searchParams.get("after");

    if (directory === "1" || forStudent) {
      const [contacts, parentRow] = await Promise.all([
        getInstituteDirectory(instituteId, userId, q || undefined),
        forStudent
          ? prisma.student.findFirst({
              where: { id: forStudent, instituteId },
              select: {
                parent: {
                  select: { user: { select: { id: true, name: true } } },
                },
              },
            })
          : Promise.resolve(null),
      ]);

      let parent: { id: string; name: string; role: string; avatar: string } | null = null;
      const parentUser = parentRow?.parent?.user;
      if (parentUser && parentUser.id !== userId) {
        parent = {
          id: parentUser.id,
          name: parentUser.name,
          role: "Parent",
          avatar: getInitials(parentUser.name),
        };
      }

      return NextResponse.json({ contacts, parent });
    }

    if (partnerId) {
      const partner = await prisma.user.findFirst({
        where: { id: partnerId, instituteId },
        select: { id: true },
      });
      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
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
      instituteId,
      q: q?.toLowerCase(),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id || !session.user.instituteId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canUseInstituteMessages(session.user.role)) {
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

    let text = (content || "").trim();
    let type: ChatContentType = contentType || "TEXT";
    let sticker: string | null = stickerId || null;

    if (sticker) {
      const def = getSticker(sticker);
      if (!def) {
        return NextResponse.json({ error: "Unknown sticker" }, { status: 400 });
      }
      type = "STICKER";
      text = def.label;
    }

    if (!targets.length || !text) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    const receivers = await prisma.user.findMany({
      where: {
        id: { in: targets },
        instituteId: session.user.instituteId,
        isActive: true,
      },
      select: { id: true },
    });
    if (!receivers.length) {
      return NextResponse.json({ error: "Receiver not found in this institute" }, { status: 404 });
    }

    const result = await sendMessages({
      senderId: session.user.id,
      senderName: session.user.name || "Staff",
      instituteId: session.user.instituteId,
      receiverIds: receivers.map((r) => r.id),
      content: text,
      subject,
      contentType: type,
      stickerId: sticker,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, emoji } = body as { messageId?: string; emoji?: string };
    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji required" }, { status: 400 });
    }

    const { reactToMessage } = await import("@/lib/messages-service");
    const result = await reactToMessage({
      userId: session.user.id,
      messageId,
      emoji,
    });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("React message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
