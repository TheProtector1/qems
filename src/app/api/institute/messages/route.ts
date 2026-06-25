import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";

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

export async function GET(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");

    if (partnerId) {
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
          time: formatTime(m.createdAt),
          self: m.senderId === userId,
        })),
      });
    }

    const allMessages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
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

    for (const m of allMessages) {
      const partner = m.senderId === userId ? m.receiver : m.sender;
      if (!partner) continue;

      if (!threadMap.has(partner.id)) {
        const unread =
          m.receiverId === userId && !m.isRead && m.senderId === partner.id;
        threadMap.set(partner.id, {
          id: partner.id,
          name: partner.name,
          role: partner.role.replace("_", " "),
          lastMsg: m.content.slice(0, 80),
          time: formatTime(m.createdAt),
          unread,
          avatar: getInitials(partner.name),
        });
      }
    }

    return NextResponse.json({ threads: Array.from(threadMap.values()) });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
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
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
