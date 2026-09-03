"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { todayDateKey, parseDateOnly } from "@/lib/timezone";
import { StudentAvatar } from "@/components/common/student-avatar";
import {
  ATTENDANCE_STATUS,
  WEEKDAYS,
  AttStatus,
  DayRecord,
  HifzLessonType,
  HIFZ_LESSON_META,
  buildCalendarDays,
  computeMonthStats,
  programLabel,
} from "@/lib/attendance-status";

type StudentOption = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender?: string;
  programType?: string;
};

export function StudentAttendanceCalendar({
  studentId,
  apiScope = "institute",
  student,
  students,
  selectedStudentId,
  onStudentChange,
  onDayClick,
  readOnly = false,
  compact = false,
}: {
  studentId: string;
  apiScope?: "institute" | "parent";
  student?: StudentOption;
  students?: StudentOption[];
  selectedStudentId?: string;
  onStudentChange?: (id: string) => void;
  onDayClick?: (record: DayRecord & { date: string }) => void;
  readOnly?: boolean;
  compact?: boolean;
}) {
  const today = todayDateKey();
  const [month, setMonth] = useState(() => parseDateOnly(today).getUTCMonth() + 1);
  const [year, setYear] = useState(() => parseDateOnly(today).getUTCFullYear());
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [hifzByDay, setHifzByDay] = useState<Record<string, Partial<Record<HifzLessonType, "done" | "not_done">>>>({});
  const [loading, setLoading] = useState(true);

  const activeStudent = student || students?.find((s) => s.id === (selectedStudentId || studentId));

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        studentId,
        month: String(month),
        year: String(year),
      });
      const res = await fetch(`/api/${apiScope}/attendance?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const map: Record<string, DayRecord> = {};
      for (const r of data.records || []) {
        map[r.date] = {
          id: r.id,
          status: r.status,
          leaveReason: r.leaveReason,
          leaveRequestedBy: r.leaveRequestedBy,
        };
      }
      setRecords(map);
      setHifzByDay(data.hifzByDay || {});
    } finally {
      setLoading(false);
    }
  }, [studentId, month, year, apiScope]);

  useEffect(() => { load(); }, [load]);

  const shift = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    const key = todayDateKey();
    const now = parseDateOnly(key);
    setMonth(now.getUTCMonth() + 1);
    setYear(now.getUTCFullYear());
    setSelectedDate(key);
  };

  const days = buildCalendarDays(year, month);
  const stats = useMemo(() => computeMonthStats(records), [records]);
  const selectedRecord = records[selectedDate];
  const monthLabel = new Date(year, month - 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" });

  const handleDayClick = (date: string, record?: DayRecord) => {
    setSelectedDate(date);
    if (record?.id && onDayClick && !readOnly) {
      onDayClick({ ...record, date });
    }
  };

  if (loading && !Object.keys(records).length) {
    return (
      <div className="dash-card p-8 flex items-center justify-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading attendance calendar…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Student picker */}
      {students && students.length > 0 && onStudentChange && (
        <div className="dash-card p-4">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Select Student
          </label>
          <div className="flex flex-wrap gap-2">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onStudentChange(s.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                  (selectedStudentId || studentId) === s.id
                    ? "border-green-600 bg-green-50 text-green-800 ring-2 ring-green-500/20"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
              >
                <StudentAvatar name={s.fullName} gender={s.gender} photo={s.photo} size="sm" rounded="full" />
                <span>{s.fullName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats hero */}
      {!compact && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-800 via-emerald-800 to-teal-900 p-5 md:p-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_55%)]" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {activeStudent ? (
              <div className="flex items-center gap-3">
                <StudentAvatar
                  name={activeStudent.fullName}
                  gender={activeStudent.gender}
                  photo={activeStudent.photo}
                  size="md"
                  rounded="full"
                />
                <div>
                  <p className="font-display font-bold text-lg">{activeStudent.fullName}</p>
                  <p className="text-emerald-100/80 text-xs">
                    {activeStudent.studentId}
                    {activeStudent.programType && ` · ${programLabel(activeStudent.programType)}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-100">
                <CalendarCheck className="h-5 w-5" />
                <span className="font-semibold">Monthly Attendance</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold">{stats.rate}%</p>
                <p className="text-[11px] text-emerald-100/80">Attendance rate</p>
              </div>
              <div className="h-14 w-14 rounded-full border-4 border-white/20 flex items-center justify-center">
                <TrendingUp className={cn("h-6 w-6", stats.rate >= 90 ? "text-green-300" : stats.rate >= 75 ? "text-amber-300" : "text-red-300")} />
              </div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-5 gap-2 mt-5">
            {([
              { label: "Present", value: stats.present, color: "bg-green-400/20" },
              { label: "Absent", value: stats.absent, color: "bg-red-400/20" },
              { label: "Late", value: stats.late, color: "bg-amber-400/20" },
              { label: "Leave", value: stats.leave, color: "bg-blue-400/20" },
              { label: "Marked Days", value: stats.marked, color: "bg-white/10" },
            ] as const).map((s) => (
              <div key={s.label} className={cn("rounded-xl px-3 py-2 border border-white/10", s.color)}>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-emerald-100/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn("grid gap-4", compact ? "grid-cols-1" : "lg:grid-cols-5")}>
        {/* Calendar grid */}
        <div className={cn("dash-card p-4 md:p-5", !compact && "lg:col-span-3")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-gray-900">{monthLabel}</h3>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => shift(-1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50" aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={goToday} className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-green-200 bg-green-50 text-green-800 hover:bg-green-100">
                Today
              </button>
              <button type="button" onClick={() => shift(1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50" aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((d, i) => (
                  <div key={d} className={cn("text-center text-[10px] font-bold uppercase tracking-wider py-1", i === 5 ? "text-emerald-600" : "text-gray-400")}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {days.map((cell, idx) => {
                  if (!cell.inMonth) {
                    return <div key={`e-${idx}`} className="min-h-[58px] md:min-h-[72px]" />;
                  }
                  const rec = records[cell.date];
                  const status = rec?.status;
                  const isSelected = cell.date === selectedDate;
                  const isToday = cell.date === today;
                  const meta = status ? ATTENDANCE_STATUS[status] : null;
                  const clickable = Boolean(rec?.id && onDayClick && !readOnly);
                  const hifz = hifzByDay[cell.date];
                  const hifzTypes = hifz
                    ? (Object.keys(hifz) as HifzLessonType[]).filter((t) => hifz[t])
                    : [];
                  const hifzTitle = hifzTypes
                    .map((t) => `${HIFZ_LESSON_META[t].label}: ${hifz![t] === "done" ? "Done" : "Not done"}`)
                    .join(" · ");

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => handleDayClick(cell.date, rec)}
                      title={
                        [
                          status === "LEAVE"
                            ? `Leave — ${rec?.leaveRequestedBy || "N/A"}: ${rec?.leaveReason || "No reason"}`
                            : status
                            ? meta!.fullLabel
                            : "No record",
                          hifzTitle,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      }
                      className={cn(
                        "min-h-[58px] md:min-h-[72px] rounded-xl border flex flex-col items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-green-500/30",
                        meta ? meta.cal : "bg-gray-50 text-gray-400 border-gray-100",
                        isSelected && "ring-2 ring-green-600 ring-offset-1 shadow-sm scale-[1.02]",
                        isToday && !isSelected && "ring-2 ring-green-400/50",
                        clickable && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
                        !clickable && "cursor-default"
                      )}
                    >
                      <span className="text-xs font-bold">{cell.day}</span>
                      {status && (
                        <span className="text-[9px] font-bold mt-0.5 opacity-90">{meta!.label}</span>
                      )}
                      {hifzTypes.length > 0 && (
                        <span className="flex items-center gap-0.5 mt-1">
                          {hifzTypes.map((t) => (
                            <span
                              key={t}
                              className={cn(
                                "inline-flex items-center justify-center h-3.5 min-w-[14px] px-0.5 rounded text-[8px] font-bold leading-none",
                                hifz![t] === "done"
                                  ? "bg-emerald-600/90 text-white"
                                  : "bg-rose-600/90 text-white"
                              )}
                            >
                              {HIFZ_LESSON_META[t].short}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100">
                {(Object.keys(ATTENDANCE_STATUS) as AttStatus[]).map((s) => {
                  const meta = ATTENDANCE_STATUS[s];
                  return (
                    <span key={s} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <span className={cn("h-2.5 w-2.5 rounded-full", meta.dot)} />
                      {meta.fullLabel}
                    </span>
                  );
                })}
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-gray-200" /> No record
                </span>
              </div>

              {Object.keys(hifzByDay).length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Hifz lessons</span>
                  {(Object.keys(HIFZ_LESSON_META) as HifzLessonType[]).map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <span className="inline-flex items-center justify-center h-3.5 min-w-[14px] px-0.5 rounded text-[8px] font-bold leading-none bg-emerald-600/90 text-white">
                        {HIFZ_LESSON_META[t].short}
                      </span>
                      {HIFZ_LESSON_META[t].label}
                    </span>
                  ))}
                  <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-600/90" /> Done
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-600/90 ml-2" /> Not done
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Day detail */}
        {!compact && (
          <div className="lg:col-span-2 dash-card p-5 flex flex-col">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PK", { weekday: "long" })}
            </p>
            <h4 className="font-display text-xl font-bold text-gray-900 mt-0.5">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PK", { month: "long", day: "numeric", year: "numeric" })}
            </h4>

            <div className="flex-1 mt-4">
              {selectedRecord ? (
                <div className={cn("rounded-2xl border p-5", ATTENDANCE_STATUS[selectedRecord.status].bg, ATTENDANCE_STATUS[selectedRecord.status].border)}>
                  {(() => {
                    const meta = ATTENDANCE_STATUS[selectedRecord.status];
                    const Icon = meta.icon;
                    return (
                      <>
                        <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 mb-3", meta.text)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className={cn("pill text-[10px] py-0", meta.pill)}>{meta.fullLabel}</span>
                        {selectedRecord.status === "LEAVE" && (
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="rounded-lg bg-white/60 p-3 border border-white/80">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase">Requested by</p>
                              <p className="font-medium text-gray-900">{selectedRecord.leaveRequestedBy || "Not specified"}</p>
                            </div>
                            <div className="rounded-lg bg-white/60 p-3 border border-white/80">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase">Reason</p>
                              <p className="font-medium text-gray-900">{selectedRecord.leaveReason || "No reason provided"}</p>
                            </div>
                          </div>
                        )}
                        {!readOnly && selectedRecord.id && onDayClick && (
                          <button
                            type="button"
                            onClick={() => onDayClick({ ...selectedRecord, date: selectedDate })}
                            className="mt-4 text-xs font-semibold text-green-700 hover:underline"
                          >
                            Edit this record →
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="py-10 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                  <User className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium text-gray-600">No attendance recorded</p>
                  <p className="text-xs text-gray-400 mt-1">This day has not been marked yet.</p>
                </div>
              )}
            </div>

            {compact === false && stats.marked > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Monthly rate</span>
                  <span className={cn("font-bold", stats.rate >= 90 ? "text-green-600" : stats.rate >= 75 ? "text-amber-600" : "text-red-500")}>
                    {stats.rate}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      stats.rate >= 90 ? "bg-green-500" : stats.rate >= 75 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${stats.rate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
