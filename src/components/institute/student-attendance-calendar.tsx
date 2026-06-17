"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";

const STATUS_CAL: Record<AttStatus, string> = {
  PRESENT: "bg-green-100 text-green-700 border-green-200",
  ABSENT: "bg-red-100 text-red-700 border-red-200",
  LATE: "bg-amber-100 text-amber-700 border-amber-200",
  LEAVE: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_LABEL: Record<AttStatus, string> = {
  PRESENT: "P",
  ABSENT: "A",
  LATE: "L",
  LEAVE: "LV",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const days: Array<{ date: string; day: number; inMonth: boolean }> = [];
  for (let i = 0; i < first.getDay(); i++) days.push({ date: "", day: 0, inMonth: false });
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(year, month - 1, d);
    days.push({ date: dt.toISOString().slice(0, 10), day: d, inMonth: true });
  }
  return days;
}

export function StudentAttendanceCalendar({ studentId }: { studentId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [records, setRecords] = useState<Record<string, AttStatus>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentId,
        month: String(month),
        year: String(year),
      });
      const res = await fetch(`/api/institute/attendance?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, AttStatus> = {};
      for (const r of data.records || []) map[r.date] = r.status;
      setRecords(map);
    } finally {
      setLoading(false);
    }
  }, [studentId, month, year]);

  useEffect(() => { load(); }, [load]);

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const days = buildCalendarDays(year, month);

  return (
    <div className="dash-card bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-gray-900">Attendance Calendar</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="p-1.5 rounded-lg border hover:bg-gray-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold min-w-[120px] text-center">
            {new Date(year, month - 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
          </span>
          <button type="button" onClick={() => shift(1)} className="p-1.5 rounded-lg border hover:bg-gray-50">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((cell, idx) => {
              if (!cell.inMonth) return <div key={`e-${idx}`} className="aspect-square" />;
              const status = records[cell.date];
              return (
                <div
                  key={cell.date}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] border",
                    status ? STATUS_CAL[status] : "bg-gray-50 text-gray-400 border-gray-100",
                    cell.date === today && "ring-2 ring-primary-500 ring-offset-1"
                  )}
                >
                  <span className="font-bold">{cell.day}</span>
                  {status && <span className="text-[8px] font-semibold">{STATUS_LABEL[status]}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
