import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { formatMessageTime, roleLabel } from "@/lib/communication";
import { notifyUser } from "@/lib/notifications";
import { NotificationType, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAFF_ROLES: Role[] = [
  Role.INSTITUTE_OWNER,
  Role.BRANCH_MANAGER,
  Role.SUPER_ADMIN,
];

function canUseInstituteMessages(role: string) {
  return STAFF_ROLES.includes(role as Role) || role === Role.TEACHER;
}

async function getInstituteDirectory(instituteId: string, currentUserId: string) {
  const users = await prisma.user.findMany({
    where: {
      instituteId,
      isActive: true,
      id: { not: currentUserId },
      role: { in: [Role.TEACHER, Role.PARENT, Role.BRANCH_MANAGER, Role.INSTITUTE_OWNER, Role.STAFF] },
    },
    select: { id: true, name: true, role: true, email: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
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
    const q = searchParams.get("q")?.trim().toLowerCase();

    if (directory === "1") {
      const contacts = await getInstituteDirectory(instituteId, userId);
      const filtered = q
        ? contacts.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.role.toLowerCase().includes(q) ||
              (c.email || "").toLowerCase().includes(q)
          )
        : contacts;
      return NextResponse.json({ contacts: filtered });
    }

    if (partnerId) {
      const partner = await prisma.user.findFirst({
        where: { id: partnerId, instituteId },
        select: { id: true },
      });
      if (!partner) {
        return NextResponse.json({ error: "Partner not found" }, { status: 404 });
      }

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      await prisma.message.updateMany({
        where: { senderId: partnerId, receiverId: userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      return NextResponse.json({
        messages: messages.map((m) => ({
          id: m.id,
          sender: getInitials(m.sender.name),
          name: m.sender.name,
          text: m.content,
          time: formatMessageTime(m.createdAt),
          createdAt: m.createdAt.toISOString(),
          self: m.senderId === userId,
          isRead: m.isRead,
          readAt: m.readAt?.toISOString() ?? null,
        })),
      });
    }

    const allMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        AND: [
          {
            OR: [
              { sender: { instituteId } },
              { receiver: { instituteId } },
            ],
          },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const unreadCounts = await prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: userId, isRead: false },
      _count: true,
    });
    const unreadBySender = new Map(unreadCounts.map((r) => [r.senderId, r._count]));

    const threadMap = new Map<
      string,
      {
        id: string;
        name: string;
        role: string;
        lastMsg: string;
        time: string;
        unread: boolean;
        unreadCount: number;
        avatar: string;
        createdAt: string;
      }
    >();

    for (const m of allMessages) {
      const partner = m.senderId === userId ? m.receiver : m.sender;
      if (!partner) continue;

      if (!threadMap.has(partner.id)) {
        const unreadCount = unreadBySender.get(partner.id) || 0;
        threadMap.set(partner.id, {
          id: partner.id,
          name: partner.name,
          role: roleLabel(partner.role),
          lastMsg: m.content.slice(0, 120),
          time: formatMessageTime(m.createdAt),
          unread: unreadCount > 0,
          unreadCount,
          avatar: getInitials(partner.name),
          createdAt: m.createdAt.toISOString(),
        });
      }
    }

    let threads = Array.from(threadMap.values());
    if (q) {
      threads = threads.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          t.lastMsg.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      threads,
      unreadTotal: threads.reduce((s, t) => s + t.unreadCount, 0),
    });
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
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    const receiver = await prisma.user.findFirst({
      where: { id: receiverId, instituteId: session.user.instituteId, isActive: true },
      select: { id: true, name: true },
    });
    if (!receiver) {
      return NextResponse.json({ error: "Receiver not found in this institute" }, { status: 404 });
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: { select: { name: true } },
      },
    });

    await notifyUser(receiverId, {
      instituteId: session.user.instituteId,
      type: NotificationType.MESSAGE,
      title: `Message from ${message.sender.name}`,
      message: content.trim().slice(0, 140),
      data: { senderId: session.user.id, messageId: message.id },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        sender: getInitials(message.sender.name),
        name: message.sender.name,
        text: message.content,
        time: "Just now",
        createdAt: message.createdAt.toISOString(),
        self: true,
        isRead: false,
        readAt: null,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
