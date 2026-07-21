"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";

type Entry = {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  teacherName: string | null;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    subject?: string;
    room?: string;
  }>;
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export function ParentTimetableContent() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/timetable");
      const data = await res.json();
      if (res.ok) setEntries(data.timetable || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading timetable…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary-700" /> Class Timetable
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Weekly schedule for your children</p>
      </div>

      {entries.length === 0 ? (
        <div className="dash-card bg-white p-10 text-center text-sm text-gray-400">
          No class timetable available yet.
        </div>
      ) : (
        entries.map((entry) => (
          <div key={`${entry.studentId}-${entry.classId}`} className="dash-card bg-white overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-gray-900">{entry.studentName}</h3>
              <p className="text-xs text-gray-500">
                {entry.className}
                {entry.teacherName ? ` · ${entry.teacherName}` : ""}
              </p>
            </div>
            {entry.schedule.length === 0 ? (
              <p className="p-4 text-xs text-gray-400">Schedule not set for this class.</p>
            ) : (
              <div className="divide-y divide-border">
                {DAY_ORDER.map((day) => {
                  const slots = entry.schedule.filter((s) => s.day === day);
                  if (!slots.length) return null;
                  return (
                    <div key={day} className="px-4 py-3 flex gap-4">
                      <p className="text-xs font-bold text-gray-500 w-24 flex-shrink-0">
                        {DAY_LABELS[day] || day}
                      </p>
                      <div className="space-y-1 flex-1">
                        {slots.map((s, i) => (
                          <p key={i} className="text-sm text-gray-800">
                            <span className="font-medium">
                              {s.startTime}–{s.endTime}
                            </span>
                            {s.subject ? ` · ${s.subject}` : ""}
                            {s.room ? ` · ${s.room}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
