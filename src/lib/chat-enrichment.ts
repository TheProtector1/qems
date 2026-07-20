export type ChatContentType = "TEXT" | "STICKER" | "RICH";

export type StickerDef = {
  id: string;
  emoji: string;
  label: string;
  /** Larger decorative glyph / short phrase shown as sticker card */
  art: string;
};

/** Curated Islamic / school-friendly sticker pack (emoji-art, no binary assets). */
export const CHAT_STICKERS: StickerDef[] = [
  { id: "salam", emoji: "🤝", label: "Assalamu Alaikum", art: "🤝\nSalam" },
  { id: "alhamdulillah", emoji: "🤲", label: "Alhamdulillah", art: "🤲\nAlhamdulillah" },
  { id: "mashallah", emoji: "✨", label: "MashaAllah", art: "✨\nMashaAllah" },
  { id: "jazakallah", emoji: "💚", label: "JazakAllah", art: "💚\nJazakAllah" },
  { id: "inshaallah", emoji: "🌙", label: "InshaAllah", art: "🌙\nInshaAllah" },
  { id: "ameen", emoji: "🕌", label: "Ameen", art: "🕌\nAmeen" },
  { id: "great-job", emoji: "🌟", label: "Great job", art: "🌟\nGreat job!" },
  { id: "keep-going", emoji: "💪", label: "Keep going", art: "💪\nKeep going" },
  { id: "well-done", emoji: "🏆", label: "Well done", art: "🏆\nWell done" },
  { id: "proud", emoji: "😊", label: "Proud of you", art: "😊\nProud!" },
  { id: "reminder", emoji: "⏰", label: "Friendly reminder", art: "⏰\nReminder" },
  { id: "see-you", emoji: "👋", label: "See you soon", art: "👋\nSee you" },
  { id: "quran", emoji: "📖", label: "Qur'an time", art: "📖\nQur'an" },
  { id: "dua", emoji: "🤲", label: "Making dua", art: "🤲\nDua" },
  { id: "celebrate", emoji: "🎉", label: "Celebrate", art: "🎉\nYay!" },
  { id: "heart", emoji: "❤️", label: "Love & care", art: "❤️\nCare" },
];

export const QUICK_EMOJIS = [
  "😊", "😄", "🥰", "😍", "🤗", "👍", "👏", "🙏", "❤️", "💚",
  "✨", "🌟", "🔥", "💯", "😂", "😅", "😎", "🤔", "😢", "😮",
  "🤝", "💪", "🏆", "🎯", "📚", "📖", "🕌", "🌙", "⭐", "✅",
];

export const REACTION_EMOJIS = ["❤️", "👍", "😊", "🙏", "✨", "😂", "👏", "💯"];

export function getSticker(id: string): StickerDef | undefined {
  return CHAT_STICKERS.find((s) => s.id === id);
}

export function stickerPreviewText(id: string): string {
  const s = getSticker(id);
  return s ? `${s.emoji} ${s.label}` : "Sticker";
}

/** Lightweight rich-text: **bold**, *italic*, `code`, and auto-links. */
export function parseRichSegments(text: string): Array<
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; value: string; href: string }
> {
  const segments: Array<
    | { type: "text"; value: string }
    | { type: "bold"; value: string }
    | { type: "italic"; value: string }
    | { type: "code"; value: string }
    | { type: "link"; value: string; href: string }
  > = [];

  const pattern =
    /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|(https?:\/\/[^\s<]+))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: text.slice(last, match.index) });
    }
    if (match[2]) segments.push({ type: "bold", value: match[2] });
    else if (match[3]) segments.push({ type: "italic", value: match[3] });
    else if (match[4]) segments.push({ type: "code", value: match[4] });
    else if (match[5]) segments.push({ type: "link", value: match[5], href: match[5] });
    last = match.index + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  if (!segments.length) segments.push({ type: "text", value: text });
  return segments;
}

export type ReactionMap = Record<string, string[]>;

export function normalizeReactions(raw: unknown): ReactionMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ReactionMap = {};
  for (const [emoji, users] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(users)) {
      out[emoji] = users.filter((u): u is string => typeof u === "string");
    }
  }
  return out;
}

export function toggleReaction(
  reactions: ReactionMap,
  emoji: string,
  userId: string
): ReactionMap {
  const next: ReactionMap = { ...reactions };
  const list = [...(next[emoji] || [])];
  const idx = list.indexOf(userId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(userId);
  if (list.length) next[emoji] = list;
  else delete next[emoji];
  return next;
}

export function threadPreview(content: string, contentType?: string | null, stickerId?: string | null) {
  if (contentType === "STICKER" || stickerId) {
    return stickerPreviewText(stickerId || content);
  }
  return content.replace(/\s+/g, " ").slice(0, 120);
}
