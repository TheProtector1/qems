import { cn } from "@/lib/utils";
import { HifzDirection } from "@prisma/client";
import { buildJuzGrid, getHifzCompletionPercent, hifzDirectionLabel } from "@/lib/hifz-progress";

export function HifzJuzGrid({
  direction = HifzDirection.REVERSE,
  currentJuz,
  compact = false,
  showHeader = true,
}: {
  direction?: HifzDirection | null;
  currentJuz: number | null | undefined;
  compact?: boolean;
  showHeader?: boolean;
}) {
  const dir = direction ?? HifzDirection.REVERSE;
  const grid = buildJuzGrid(dir, currentJuz);
  const pct = getHifzCompletionPercent(dir, currentJuz);

  return (
    <div>
      {showHeader && (
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <div>
            <h3 className="font-display font-bold text-gray-900">Hifz Map — 30 Para/Juz</h3>
            <p className="text-xs text-gray-500 mt-0.5">{hifzDirectionLabel(dir)}</p>
          </div>
          <span className="pill pill-success">{pct}% Complete</span>
        </div>
      )}
      <div className={cn("grid gap-1.5", compact ? "grid-cols-6 sm:grid-cols-10" : "grid-cols-5 sm:grid-cols-10")}>
        {grid.map(({ juz, state }) => (
          <div
            key={juz}
            title={`Para ${juz}${
              state === "completed" ? " — memorised" : state === "current" ? " — in progress" : ""
            }`}
            className={cn(
              compact ? "h-7 text-[9px]" : "h-8 text-[10px]",
              "rounded-lg flex items-center justify-center font-bold transition-all",
              state === "completed" && "bg-primary-600 text-white shadow-sm",
              state === "current" && "bg-primary-300 text-primary-900 ring-2 ring-primary-500 ring-offset-1",
              state === "upcoming" && "bg-gray-100 text-gray-400"
            )}
          >
            {juz}
          </div>
        ))}
      </div>
    </div>
  );
}
