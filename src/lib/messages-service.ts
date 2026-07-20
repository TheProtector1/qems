import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { formatMessageTime, roleLabel } from "@/lib/communication";
import {
  normalizeReactions,
  threadPreview,
  toggleReaction,
  type ChatContentType,
  type ReactionMap,
} from "@/lib/chat-enrichment";
import { notifyUser } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

const THREAD_SCAN_LIMIT = 400;
const CONVERSATION_PAGE = 80;

export type MessageDto = {
  id: string;
  sender: string;
  name: string;
  text: string;
  time: string;
  createdAt: string;
  self: boolean;
  isRead: boolean;
  readAt: string | null;
  contentType: ChatContentType;
  stickerId: string | null;
  reactions: ReactionMap;
  subject: string | null;
};

function toDto(
  m: {
    id: string;
    content: string;
    contentType: string;
    stickerId: string | null;
    reactions: Prisma.JsonValue | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    senderId: string;
    subject: string | null;
    sender: { name: string };
  },
  userId: string
): MessageDto {
  return {
    id: m.id,
    sender: getInitials(m.sender.name),
    name: m.sender.name,
    text: m.content,
    time: formatMessageTime(m.createdAt),
    createdAt: m.createdAt.toISOString(),
    self: m.senderId === userId,
    isRead: m.isRead,
    readAt: m.readAt?.toISOString() ?? null,
    contentType: (m.contentType as ChatContentType) || "TEXT",
    stickerId: m.stickerId,
    reactions: normalizeReactions(m.reactions),
    subject: m.subject,
  };
}

/** Build inbox threads from a capped recent-message scan (avoids full table load). */
export async function listThreadsForUser(opts: {
  userId: string;
  q?: string;
  /** Extra filter: only messages involving these partner ids (teacher/parent allowlists) */
  partnerIds?: string[];
  /** When set, only include partners in this institute */
  instituteId?: string;
}) {
  const { userId, q, partnerIds, instituteId } = opts;

  if (partnerIds && partnerIds.length === 0) {
    return { threads: [], unreadTotal: 0 };
  }

  const partnerFilter =
    partnerIds && partnerIds.length
      ? {
          OR: [
            { senderId: userId, receiverId: { in: partnerIds } },
            { senderId: { in: partnerIds }, receiverId: userId },
          ],
        }
      : {
          OR: [{ senderId: userId }, { receiverId: userId }],
        };

  const instituteFilter = instituteId
    ? {
        AND: [
          partnerFilter,
          {
            OR: [
              { sender: { instituteId } },
              { receiver: { instituteId } },
            ],
          },
        ],
      }
    : partnerFilter;

  const [recent, unreadCounts] = await Promise.all([
    prisma.message.findMany({
      where: instituteFilter,
      select: {
        id: true,
        content: true,
        contentType: true,
        stickerId: true,
        createdAt: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: THREAD_SCAN_LIMIT,
    }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: {
        receiverId: userId,
        isRead: false,
        ...(partnerIds?.length ? { senderId: { in: partnerIds } } : {}),
      },
      _count: true,
    }),
  ]);

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

  for (const m of recent) {
    const partner = m.senderId === userId ? m.receiver : m.sender;
    if (!partner) continue;
    if (partnerIds && !partnerIds.includes(partner.id)) continue;
    if (threadMap.has(partner.id)) continue;

    const unreadCount = unreadBySender.get(partner.id) || 0;
    threadMap.set(partner.id, {
      id: partner.id,
      name: partner.name,
      role: roleLabel(partner.role),
      lastMsg: threadPreview(m.content, m.contentType, m.stickerId),
      time: formatMessageTime(m.createdAt),
      unread: unreadCount > 0,
      unreadCount,
      avatar: getInitials(partner.name),
      createdAt: m.createdAt.toISOString(),
    });
  }

  // Seed empty threads for allowlisted partners with no messages yet
  if (partnerIds?.length) {
    const missing = partnerIds.filter((id) => !threadMap.has(id));
    if (missing.length) {
      const users = await prisma.user.findMany({
        where: { id: { in: missing }, isActive: true },
        select: { id: true, name: true, role: true },
      });
      for (const u of users) {
        threadMap.set(u.id, {
          id: u.id,
          name: u.name,
          role: roleLabel(u.role),
          lastMsg: "Start a conversation",
          time: "",
          unread: false,
          unreadCount: 0,
          avatar: getInitials(u.name),
          createdAt: "",
        });
      }
    }
  }

  let threads = Array.from(threadMap.values()).sort((a, b) => {
    if (a.unread !== b.unread) return a.unread ? -1 : 1;
    return (b.createdAt || "").localeCompare(a.createdAt || "");
  });

  if (q) {
    const ql = q.toLowerCase();
    threads = threads.filter(
      (t) =>
        t.name.toLowerCase().includes(ql) ||
        t.role.toLowerCase().includes(ql) ||
        t.lastMsg.toLowerCase().includes(ql)
    );
  }

  return {
    threads,
    unreadTotal: threads.reduce((s, t) => s + t.unreadCount, 0),
  };
}

export async function listConversation(opts: {
  userId: string;
  partnerId: string;
  after?: string | null;
  markRead?: boolean;
}) {
  const { userId, partnerId, after, markRead = true } = opts;

  const afterFilter = after
    ? { createdAt: { gt: new Date(after) } }
    : {};

  const messages = await prisma.message.findMany({
    where: {
      AND: [
        {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        afterFilter,
      ],
    },
    select: {
      id: true,
      content: true,
      contentType: true,
      stickerId: true,
      reactions: true,
      isRead: true,
      readAt: true,
      createdAt: true,
      senderId: true,
      subject: true,
      sender: { select: { name: true } },
    },
    orderBy: { createdAt: after ? "asc" : "desc" },
    take: after ? 100 : CONVERSATION_PAGE,
  });

  // Newest-first fetch → reverse for chronological UI when not incremental
  const ordered = after ? messages : [...messages].reverse();

  if (markRead && !after) {
    // Only write when there is something to update
    const unread = await prisma.message.count({
      where: { senderId: partnerId, receiverId: userId, isRead: false },
    });
    if (unread > 0) {
      await prisma.message.updateMany({
        where: { senderId: partnerId, receiverId: userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    }
  }

  return {
    messages: ordered.map((m) => toDto(m, userId)),
    hasMore: !after && messages.length === CONVERSATION_PAGE,
  };
}

export async function sendMessages(opts: {
  senderId: string;
  senderName: string;
  instituteId?: string | null;
  receiverIds: string[];
  content: string;
  subject?: string | null;
  contentType?: ChatContentType;
  stickerId?: string | null;
}) {
  const {
    senderId,
    senderName,
    instituteId,
    receiverIds,
    content,
    subject,
    contentType = "TEXT",
    stickerId = null,
  } = opts;

  const trimmed = content.trim();
  const subjectText = subject?.trim() || null;
  const type = stickerId ? "STICKER" : contentType;

  const created = await prisma.$transaction(
    receiverIds.map((receiverId) =>
      prisma.message.create({
        data: {
          senderId,
          receiverId,
          content: trimmed,
          subject: subjectText,
          contentType: type,
          stickerId,
        },
        select: {
          id: true,
          content: true,
          contentType: true,
          stickerId: true,
          reactions: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          senderId: true,
          subject: true,
          sender: { select: { name: true } },
        },
      })
    )
  );

  // Fire-and-forget notifications (don't block send latency)
  void Promise.all(
    created.map((message, i) =>
      notifyUser(receiverIds[i], {
        instituteId,
        type: NotificationType.MESSAGE,
        title: subjectText || `Message from ${senderName}`,
        message: threadPreview(trimmed, type, stickerId).slice(0, 140),
        data: { senderId, messageId: message.id },
      }).catch((err) => console.error("[MSG_NOTIFY]", err))
    )
  );

  return {
    sent: created.length,
    message: toDto(created[0], senderId),
  };
}

export async function reactToMessage(opts: {
  userId: string;
  messageId: string;
  emoji: string;
}) {
  const message = await prisma.message.findFirst({
    where: {
      id: opts.messageId,
      OR: [{ senderId: opts.userId }, { receiverId: opts.userId }],
    },
    select: { id: true, reactions: true },
  });
  if (!message) return null;

  const next = toggleReaction(normalizeReactions(message.reactions), opts.emoji, opts.userId);

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { reactions: next },
    select: { id: true, reactions: true },
  });

  return { id: updated.id, reactions: normalizeReactions(updated.reactions) };
}
