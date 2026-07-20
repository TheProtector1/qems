"use client";

import { useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSticker,
  parseRichSegments,
  REACTION_EMOJIS,
  type ReactionMap,
  type ChatContentType,
} from "@/lib/chat-enrichment";

export type ChatBubbleMessage = {
  id?: string;
  text: string;
  time: string;
  self: boolean;
  isRead?: boolean;
  contentType?: ChatContentType;
  stickerId?: string | null;
  reactions?: ReactionMap;
  createdAt?: string;
};

export function ChatMessageBubble({
  msg,
  currentUserId,
  onReact,
}: {
  msg: ChatBubbleMessage;
  currentUserId?: string;
  onReact?: (messageId: string, emoji: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const sticker = msg.stickerId ? getSticker(msg.stickerId) : null;
  const isSticker = msg.contentType === "STICKER" || Boolean(sticker);
  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions).filter(([, users]) => users.length > 0);

  return (
    <div
      className={cn(
        "group relative flex flex-col max-w-[85%] sm:max-w-[72%]",
        msg.self ? "ml-auto items-end" : "mr-auto items-start"
      )}
      onMouseLeave={() => setPickerOpen(false)}
    >
      {isSticker && sticker ? (
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-center shadow-sm border min-w-[120px]",
            msg.self
              ? "bg-gradient-to-br from-primary-600 to-primary-800 text-white border-primary-500/30 rounded-br-md"
              : "bg-white text-gray-800 border-gray-100 rounded-bl-md"
          )}
        >
          <div className="text-4xl leading-none mb-1.5 select-none">{sticker.emoji}</div>
          <p className={cn("text-xs font-semibold", msg.self ? "text-primary-100" : "text-gray-600")}>
            {sticker.label}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
            msg.self
              ? "bg-gradient-primary text-white rounded-br-md"
              : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
          )}
        >
          <p className="leading-relaxed whitespace-pre-wrap break-words">
            {parseRichSegments(msg.text).map((seg, i) => {
              if (seg.type === "bold")
                return (
                  <strong key={i} className="font-bold">
                    {seg.value}
                  </strong>
                );
              if (seg.type === "italic")
                return (
                  <em key={i} className="italic">
                    {seg.value}
                  </em>
                );
              if (seg.type === "code")
                return (
                  <code
                    key={i}
                    className={cn(
                      "px-1 py-0.5 rounded text-[11px] font-mono",
                      msg.self ? "bg-white/20" : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {seg.value}
                  </code>
                );
              if (seg.type === "link")
                return (
                  <a
                    key={i}
                    href={seg.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "underline break-all",
                      msg.self ? "text-primary-100" : "text-primary-700"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {seg.value}
                  </a>
                );
              return <span key={i}>{seg.value}</span>;
            })}
          </p>
        </div>
      )}

      {reactionEntries.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-1 mt-1",
            msg.self ? "justify-end" : "justify-start"
          )}
        >
          {reactionEntries.map(([emoji, users]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => msg.id && onReact?.(msg.id, emoji)}
              className={cn(
                "inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded-full border bg-white shadow-sm hover:scale-105 transition-transform",
                currentUserId && users.includes(currentUserId)
                  ? "border-primary-300 bg-primary-50"
                  : "border-gray-100"
              )}
              title={`${users.length} reaction${users.length === 1 ? "" : "s"}`}
            >
              <span>{emoji}</span>
              <span className="text-gray-500 font-medium">{users.length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1 mt-1 px-1 relative">
        <span className="text-[9px] text-gray-400">{msg.time}</span>
        {msg.self && (
          <span className="text-primary-600" title={msg.isRead ? "Read" : "Sent"}>
            {msg.isRead ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3 text-gray-400" />
            )}
          </span>
        )}
        {msg.id && onReact && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-[10px] text-gray-400 hover:text-primary-600 px-1 transition-opacity"
              title="Add reaction"
            >
              🙂
            </button>
            {pickerOpen && (
              <div
                className={cn(
                  "absolute bottom-full mb-1 z-20 flex gap-0.5 p-1 rounded-xl bg-white border border-gray-100 shadow-lg",
                  msg.self ? "right-0" : "left-0"
                )}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="h-7 w-7 rounded-lg hover:bg-gray-50 text-sm"
                    onClick={() => {
                      onReact(msg.id!, emoji);
                      setPickerOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
