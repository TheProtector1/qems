import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { formatMessageTime, roleLabel } from "@/lib/communication";
import { notifyUser } from "@/lib/notifications";
import { NotificationType, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

async function getParentPartners(parentUserId: string, instituteId: string | null | undefined) {
  const map = new Map<string, { id: string; name: string; role: string }>();

  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    include: {
      students: {
        where: { isActive: true },
        include: {
          teacher: {
            include: { user: { select: { id: true, name: true, role: true } } },
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

  let instId = instituteId;
  if (!instId && parent?.id) {
    const student = await prisma.student.findFirst({
      where: { parentId: parent.id, isActive: true },
      select: { instituteId: true },
    });
    instId = student?.instituteId ?? null;
  }

  if (instId) {
    const staff = await prisma.user.findMany({
      where: {
        instituteId: instId,
        isActive: true,
        id: { not: parentUserId },
        role: { in: [Role.INSTITUTE_OWNER, Role.BRANCH_MANAGER] },
      },
      select: { id: true, name: true, role: true },
    });
    for (const u of staff) {
      map.set(u.id, { id: u.id, name: u.name, role: roleLabel(u.role) });
    }
  }

  return map;
}

async function canParentMessage(
  parentUserId: string,
  partnerUserId: string,
  instituteId: string | null | undefined
) {
  const partners = await getParentPartners(parentUserId, instituteId);
  return partners.has(partnerUserId);
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
    const q = searchParams.get("q")?.trim().toLowerCase();

    const allowedPartners = await getParentPartners(userId, instituteId);

    if (directory === "1") {
      let contacts = Array.from(allowedPartners.values()).map((p) => ({
        ...p,
        avatar: getInitials(p.name),
      }));
      if (q) {
        contacts = contacts.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.role.toLowerCase().includes(q)
        );
      }
      return NextResponse.json({ contacts });
    }

    if (partnerId) {
      if (!(await canParentMessage(userId, partnerId, instituteId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        include: { sender: { select: { id: true, name: true } } },
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

    const allowedIds = Array.from(allowedPartners.keys());
    if (!allowedIds.length) {
      return NextResponse.json({ threads: [], unreadTotal: 0 });
    }

    const allMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: allowedIds } },
          { senderId: { in: allowedIds }, receiverId: userId },
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
      where: { receiverId: userId, isRead: false, senderId: { in: allowedIds } },
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

    Array.from(allowedPartners.values()).forEach((partner) => {
      threadMap.set(partner.id, {
        id: partner.id,
        name: partner.name,
        role: partner.role,
        lastMsg: "Start a conversation",
        time: "",
        unread: false,
        unreadCount: 0,
        avatar: getInitials(partner.name),
        createdAt: "",
      });
    });

    for (const m of allMessages) {
      const partner = m.senderId === userId ? m.receiver : m.sender;
      if (!partner || !allowedPartners.has(partner.id)) continue;

      const existing = threadMap.get(partner.id);
      if (!existing || existing.lastMsg === "Start a conversation") {
        const unreadCount = unreadBySender.get(partner.id) || 0;
        threadMap.set(partner.id, {
          id: partner.id,
          name: partner.name,
          role: allowedPartners.get(partner.id)?.role || roleLabel(partner.role),
          lastMsg: m.content.slice(0, 120),
          time: formatMessageTime(m.createdAt),
          unread: unreadCount > 0,
          unreadCount,
          avatar: getInitials(partner.name),
          createdAt: m.createdAt.toISOString(),
        });
      }
    }

    let threads = Array.from(threadMap.values()).sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1;
      return (b.createdAt || "").localeCompare(a.createdAt || "");
    });

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
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    if (!(await canParentMessage(session.user.id, receiverId, session.user.instituteId))) {
      return NextResponse.json(
        { error: "You can only message your child's teachers or institute leadership" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
      },
      include: { sender: { select: { name: true } } },
    });

    await notifyUser(receiverId, {
      type: NotificationType.MESSAGE,
      title: `Message from ${session.user.name || "Parent"}`,
      message: content.trim().slice(0, 140),
      instituteId: session.user.instituteId,
      data: { messageId: message.id, senderId: session.user.id },
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
    console.error("[PARENT_MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
