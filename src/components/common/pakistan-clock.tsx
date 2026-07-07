"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPakistanClockSnapshot } from "@/lib/timezone";

type Variant = "topbar" | "dashboard";

export function PakistanClock({ variant = "topbar", className }: { variant?: Variant; className?: string }) {
  const [clock, setClock] = useState(() => getPakistanClockSnapshot());

  useEffect(() => {
    const tick = () => setClock(getPakistanClockSnapshot());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  if (variant === "dashboard") {
    return (
      <div
        className={cn(
          "dash-card bg-gradient-to-br from-slate-900 via-primary-900 to-emerald-950 text-white p-4 sm:p-5",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-200/90">
              Institute time · {clock.label}
            </p>
            <p className="font-display text-2xl sm:text-3xl font-bold mt-1 tabular-nums">{clock.time}</p>
            <p className="text-sm text-primary-100/90 mt-1">{clock.longDate}</p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <Clock className="h-5 w-5 text-emerald-200" />
          </div>
        </div>
        <p className="text-[11px] text-primary-200/70 mt-3">
          Attendance, schedules, and daily records follow Pakistan time ({clock.timezone}).
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex lg:hidden items-center gap-1 rounded-lg bg-gray-50 border border-gray-200 px-2 py-1",
          className
        )}
        title={`${clock.label}`}
      >
        <Clock className="h-3 w-3 text-primary-700" />
        <span className="text-[10px] font-semibold text-gray-800 tabular-nums">{clock.time}</span>
        <span className="text-[9px] text-primary-700 font-bold">{clock.timezone}</span>
      </div>
      <div
        className={cn(
          "hidden lg:flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-1.5",
          className
        )}
        title={`${clock.label} — all institute dates and attendance use this timezone`}
      >
        <Clock className="h-3.5 w-3.5 text-primary-700 flex-shrink-0" />
        <div className="text-left leading-tight min-w-0">
          <p className="text-[11px] font-semibold text-gray-900 tabular-nums truncate">
            {clock.time} <span className="text-primary-700">{clock.timezone}</span>
          </p>
          <p className="text-[10px] text-gray-500 truncate">{clock.weekday}, {clock.shortDate}</p>
        </div>
      </div>
    </>
  );
}
