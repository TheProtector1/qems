import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { notifyUser } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

async function getTeacherParentPartners(teacherUserId: string) {
  const teacher = await prisma.teacher.findFirst({
    where: { userId: teacherUserId },
    include: {
      students: {
        where: { isActive: true },
        include: {
          parent: { include: { user: { select: { id: true, name: true, role: true } } } },
        },
      },
    },
  });

  const map = new Map<string, { id: string; name: string; role: string }>();
  for (const student of teacher?.students || []) {
    const parentUser = student.parent?.user;
    if (parentUser) {
      map.set(parentUser.id, {
        id: parentUser.id,
        name: parentUser.name,
        role: "PARENT",
      });
    }
  }
  return map;
}

async function canTeacherMessage(teacherUserId: string, partnerUserId: string) {
  const partners = await getTeacherParentPartners(teacherUserId);
  return partners.has(partnerUserId);
}

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");

    if (partnerId) {
      if (!(await canTeacherMessage(userId, partnerId))) {
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
          time: formatTime(m.createdAt),
          self: m.senderId === userId,
        })),
      });
    }

    const allowedPartners = await getTeacherParentPartners(userId);
    const allowedIds = Array.from(allowedPartners.keys());

    if (!allowedIds.length) {
      return NextResponse.json({ threads: [] });
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

    const threadMap = new Map<
      string,
      { id: string; name: string; role: string; lastMsg: string; time: string; unread: boolean; avatar: string }
    >();

    for (const partner of allowedPartners.values()) {
      threadMap.set(partner.id, {
        id: partner.id,
        name: partner.name,
        role: "Parent",
        lastMsg: "Start a conversation",
        time: "",
        unread: false,
        avatar: getInitials(partner.name),
      });
    }

    for (const m of allMessages) {
      const partner = m.senderId === userId ? m.receiver : m.sender;
      if (!partner || !allowedPartners.has(partner.id)) continue;

      if (!threadMap.has(partner.id) || threadMap.get(partner.id)?.lastMsg === "Start a conversation") {
        const unread = m.receiverId === userId && !m.isRead;
        threadMap.set(partner.id, {
          id: partner.id,
          name: partner.name,
          role: "Parent",
          lastMsg: m.content.slice(0, 80),
          time: formatTime(m.createdAt),
          unread,
          avatar: getInitials(partner.name),
        });
      }
    }

    return NextResponse.json({ threads: Array.from(threadMap.values()) });
  } catch (error) {
    console.error("[TEACHER_MESSAGES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    if (!(await canTeacherMessage(session.user.id, receiverId))) {
      return NextResponse.json({ error: "You can only message parents of your students" }, { status: 403 });
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
      title: "New message from teacher",
      message: `${session.user.name || "Your teacher"}: ${content.trim().slice(0, 120)}`,
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
        self: true,
      },
    });
  } catch (error) {
    console.error("[TEACHER_MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
