"use client";

import { useState } from "react";
import { Smile, Sticker, Bold, Italic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_STICKERS, QUICK_EMOJIS } from "@/lib/chat-enrichment";

export function ChatComposerToolbar({
  onInsertEmoji,
  onSendSticker,
  onWrap,
  disabled,
}: {
  onInsertEmoji: (emoji: string) => void;
  onSendSticker: (stickerId: string) => void;
  onWrap: (before: string, after: string) => void;
  disabled?: boolean;
}) {
  const [panel, setPanel] = useState<"emoji" | "sticker" | null>(null);

  return (
    <div className="relative">
      <div className="flex items-center gap-0.5 px-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPanel((p) => (p === "emoji" ? null : "emoji"))
          }
          className={cn(
            "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-700",
            panel === "emoji" && "bg-primary-50 text-primary-700"
          )}
          title="Emojis"
        >
          <Smile className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPanel((p) => (p === "sticker" ? null : "sticker"))}
          className={cn(
            "p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-700",
            panel === "sticker" && "bg-primary-50 text-primary-700"
          )}
          title="Stickers"
        >
          <Sticker className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onWrap("**", "**")}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-700"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onWrap("*", "*")}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary-700"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
      </div>

      {panel && (
        <div className="absolute bottom-full left-0 mb-2 z-30 w-[min(100vw-2rem,320px)] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50 bg-gray-50/80">
            <p className="text-xs font-semibold text-gray-700">
              {panel === "emoji" ? "Emojis" : "Stickers"}
            </p>
            <button
              type="button"
              onClick={() => setPanel(null)}
              className="p-1 rounded-md text-gray-400 hover:bg-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {panel === "emoji" ? (
            <div className="p-2 grid grid-cols-8 gap-0.5 max-h-44 overflow-y-auto">
              {QUICK_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onInsertEmoji(e);
                  }}
                  className="h-9 w-9 rounded-lg text-lg hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  {e}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2 grid grid-cols-4 gap-2 max-h-56 overflow-y-auto">
              {CHAT_STICKERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSendSticker(s.id);
                    setPanel(null);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-50 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                >
                  <span className="text-2xl leading-none">{s.emoji}</span>
                  <span className="text-[9px] font-medium text-gray-600 text-center leading-tight">
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
