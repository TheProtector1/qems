"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Loader2, RefreshCw, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  studentId: string;
  studentName: string;
  studentCode: string;
  priority: "critical" | "high" | "medium";
  reason: string;
  suggestedType: "SABQI" | "MANZIL";
  lastLesson: {
    surahName: string;
    ayahFrom: number;
    ayahTo: number;
    rating: number;
    errorCount: number;
    date: string;
  } | null;
  daysSinceSabaq: number | null;
};

const priorityStyle = {
  critical: "bg-red-50 border-red-200 text-red-800",
  high: "bg-amber-50 border-amber-200 text-amber-900",
  medium: "bg-gray-50 border-gray-200 text-gray-700",
};

export function HifzRevisionPlanPanel({
  onSelectStudent,
}: {
  onSelectStudent?: (studentId: string) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState({ critical: 0, high: 0, medium: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/hifz/revision-plan");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
      setSummary(data.summary || { critical: 0, high: 0, medium: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="dash-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary-700" /> Today&apos;s revision plan
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Spaced Sabqi / Manzil recommendations from recent lesson quality
          </p>
        </div>
        <button type="button" className="btn-ghost text-xs py-1.5" onClick={load} disabled={loading}>
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-red-100 text-red-800">
          {summary.critical} critical
        </span>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-amber-100 text-amber-900">
          {summary.high} high
        </span>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-700">
          {summary.medium} routine
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No Hifz students to plan for.</p>
      ) : (
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.studentId}
              type="button"
              onClick={() => onSelectStudent?.(item.studentId)}
              className={cn(
                "w-full text-left rounded-xl border p-3 transition-colors hover:shadow-sm",
                priorityStyle[item.priority]
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {item.studentName}{" "}
                    <span className="font-mono text-[10px] opacity-70">({item.studentCode})</span>
                  </p>
                  <p className="text-xs mt-1 opacity-90">{item.reason}</p>
                  {item.lastLesson && (
                    <p className="text-[11px] mt-1 opacity-75 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Last: {item.lastLesson.surahName} {item.lastLesson.ayahFrom}–
                      {item.lastLesson.ayahTo} · {item.lastLesson.errorCount} err · ★
                      {item.lastLesson.rating}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-white/70">
                  {item.suggestedType}
                </span>
              </div>
              {item.priority === "critical" && (
                <p className="text-[10px] font-semibold mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Prioritize in today&apos;s session
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
