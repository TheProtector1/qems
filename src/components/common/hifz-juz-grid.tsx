"use client";

import { cn, formatDate } from "@/lib/utils";
import { HifzDirection } from "@prisma/client";
import {
  buildJuzGrid,
  getHifzCompletionPercent,
  hifzDirectionLabel,
  type JuzCellState,
  type ParaCompletionInfo,
} from "@/lib/hifz-progress";
import { CheckCircle2 } from "lucide-react";

export function HifzJuzGrid({
  direction = HifzDirection.REVERSE,
  currentJuz,
  compact = false,
  showHeader = true,
  interactive = false,
  hifzCompleted = false,
  completedParas = [],
  paraDetails = {},
  onParaClick,
}: {
  direction?: HifzDirection | null;
  currentJuz: number | null | undefined;
  compact?: boolean;
  showHeader?: boolean;
  interactive?: boolean;
  hifzCompleted?: boolean;
  completedParas?: number[];
  paraDetails?: Record<number, ParaCompletionInfo>;
  onParaClick?: (para: number, state: JuzCellState, completion: ParaCompletionInfo | null) => void;
}) {
  const dir = direction ?? HifzDirection.REVERSE;
  const grid = buildJuzGrid(dir, currentJuz, {
    completedParas,
    hifzCompleted,
    paraDetails,
  });
  const pct = getHifzCompletionPercent(dir, currentJuz, {
    completedCount: completedParas.length,
    hifzCompleted,
  });

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div>
            <h3 className="font-display font-bold text-gray-900">Hifz Map — 30 Para/Juz</h3>
            <p className="text-xs text-gray-500 mt-0.5">{hifzDirectionLabel(dir)}</p>
            {interactive && !hifzCompleted && (
              <p className="text-xs text-primary-700 mt-1">
                Click the highlighted current para to mark it complete (days taken, date, notes)
              </p>
            )}
          </div>
          <span className={cn("pill", hifzCompleted ? "pill-success" : "pill-success")}>
            {hifzCompleted ? "Hifz Complete" : `${pct}% Complete`}
          </span>
        </div>
      )}
      <div className={cn("grid gap-1.5", compact ? "grid-cols-6 sm:grid-cols-10" : "grid-cols-5 sm:grid-cols-10")}>
        {grid.map(({ juz, state, completion }) => {
          const clickable =
            interactive &&
            onParaClick &&
            (state === "current" || (state === "completed" && completion));
          const title =
            state === "completed" && completion
              ? `Para ${juz} — ${completion.daysToComplete} days${completion.notes ? ` · ${completion.notes}` : ""}`
              : `Para ${juz}${
                  state === "completed"
                    ? " — memorised"
                    : state === "current"
                      ? " — click to mark complete"
                      : ""
                }`;

          return (
            <button
              key={juz}
              type="button"
              disabled={!clickable}
              title={title}
              onClick={() => clickable && onParaClick(juz, state, completion)}
              className={cn(
                compact ? "h-7 text-[9px]" : "h-8 text-[10px]",
                "rounded-lg flex items-center justify-center font-bold transition-all relative",
                state === "completed" && "bg-primary-600 text-white shadow-sm",
                state === "current" &&
                  "bg-primary-300 text-primary-900 ring-2 ring-primary-500 ring-offset-1",
                state === "upcoming" && "bg-gray-100 text-gray-400",
                clickable && state === "current" && "cursor-pointer hover:ring-4 hover:scale-105",
                clickable && state === "completed" && "cursor-pointer hover:opacity-90",
                !clickable && "cursor-default"
              )}
            >
              {juz}
              {state === "completed" && completion && (
                <CheckCircle2 className="h-2.5 w-2.5 absolute top-0.5 right-0.5 opacity-80" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ParaCompletionHistory({
  completions,
}: {
  completions: ParaCompletionInfo[];
}) {
  if (!completions.length) return null;

  const sorted = [...completions].sort((a, b) => a.paraNumber - b.paraNumber);

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Para Completion Log</h4>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sorted.map((c) => (
          <div
            key={c.paraNumber}
            className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs p-3 rounded-xl bg-gray-50 border border-gray-100"
          >
            <span className="font-bold text-primary-800 w-16 shrink-0">Para {c.paraNumber}</span>
            <span className="text-gray-600">{c.daysToComplete} day{c.daysToComplete !== 1 ? "s" : ""}</span>
            <span className="text-gray-400">{formatDate(c.completedAt)}</span>
            {c.notes && <span className="text-gray-500 sm:ml-auto truncate">{c.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
