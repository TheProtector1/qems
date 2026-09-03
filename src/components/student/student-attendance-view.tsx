"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  format,
  isToday,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
  Loader2,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "@/components/common/student-avatar";
import {
  ATTENDANCE_STATUS,
  HIFZ_LESSON_META,
  type AttStatus,
  type DayRecord,
  type HifzLessonType,
  programLabel,
} from "@/lib/attendance-status";

type StudentProfile = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender?: string;
  programType?: string;
};

type MonthSummary = {
  present: number;
  absent: number;
  late: number;
  leave: number;
  marked: number;
  rate: number;
  streak: number;
};

const MOTIVATION: Record<AttStatus, { title: string; body: string }> = {
  PRESENT: {
    title: "Well done!",
    body: "You attended class — keep up the excellent commitment to your studies.",
  },
  ABSENT: {
    title: "Marked absent",
    body: "If this was a mistake, speak with your teacher or parent to get it corrected.",
  },
  LATE: {
    title: "Arrived late",
    body: "Try to arrive a few minutes early next time. Every minute of class counts.",
  },
  LEAVE: {
    title: "Approved leave",
    body: "Your leave was recorded. We hope everything is well — see you when you return.",
  },
  HOLIDAY: {
    title: "Institute holiday",
    body: "No class today — enjoy the break and return refreshed for your studies.",
  },
};

const RATE_MESSAGES = [
  { min: 95, label: "Outstanding!", icon: Award, color: "text-amber-300" },
  { min: 85, label: "Great progress", icon: TrendingUp, color: "text-green-300" },
  { min: 70, label: "Keep going", icon: Sparkles, color: "text-emerald-200" },
  { min: 0, label: "Room to grow", icon: CalendarCheck, color: "text-white/80" },
];

function AttendanceRing({ rate }: { rate: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (rate / 100) * c;
  const stroke =
    rate >= 90 ? "#86efac" : rate >= 75 ? "#fcd34d" : rate > 0 ? "#fca5a5" : "rgba(255,255,255,0.25)";

  return (
    <div className="relative h-24 w-24 flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{rate}%</span>
        <span className="text-[9px] text-emerald-100/80 uppercase tracking-wider">This month</span>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
      <div className="h-40 rounded-2xl bg-gray-200" />
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 h-96 rounded-2xl bg-gray-100" />
        <div className="lg:col-span-2 h-96 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

export function StudentAttendanceView() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [hifzByDay, setHifzByDay] = useState<Record<string, Partial<Record<HifzLessonType, "done" | "not_done">>>>({});
  const [summary, setSummary] = useState<MonthSummary>({
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    marked: 0,
    rate: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      const res = await fetch(`/api/student/attendance?month=${month}&year=${year}`);
      if (!res.ok) return;
      const data = await res.json();
      setStudent(data.student || null);
      setSummary(
        data.summary || {
          present: 0,
          absent: 0,
          late: 0,
          leave: 0,
          marked: 0,
          rate: 0,
          streak: 0,
        }
      );
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    load();
  }, [load]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const selectedRecord = records[selectedKey];

  const recentDays = useMemo(() => {
    return Object.entries(records)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 5)
      .map(([date, rec]) => ({ date, ...rec }));
  }, [records]);

  const rateMsg = RATE_MESSAGES.find((m) => summary.rate >= m.min) || RATE_MESSAGES[RATE_MESSAGES.length - 1];
  const RateIcon = rateMsg.icon;

  const shiftMonth = (delta: number) => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + delta);
    setCurrentMonth(next);
  };

  const goToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  if (loading && !student) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-teal-900 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {student && (
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <StudentAvatar
                name={student.fullName}
                gender={student.gender}
                photo={student.photo}
                size="lg"
                rounded="2xl"
              />
              <div className="min-w-0">
                <p className="text-emerald-100/90 text-sm">My Attendance</p>
                <h2 className="font-display text-2xl md:text-3xl font-bold truncate">{student.fullName}</h2>
                <p className="text-emerald-100/70 text-xs mt-0.5">
                  {student.studentId}
                  {student.programType && ` · ${programLabel(student.programType)}`}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-5">
            <AttendanceRing rate={summary.rate} />
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-2">
                <Flame className="h-5 w-5 text-orange-300" />
                <div>
                  <p className="text-lg font-bold leading-none">{summary.streak}</p>
                  <p className="text-[10px] text-emerald-100/80">Day streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RateIcon className={cn("h-4 w-4", rateMsg.color)} />
                <span className="text-emerald-50 font-medium">{rateMsg.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat chips */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          {(
            [
              { key: "present", label: "Present", value: summary.present, gradient: "from-green-400/30 to-emerald-500/20" },
              { key: "late", label: "Late", value: summary.late, gradient: "from-amber-400/30 to-orange-500/20" },
              { key: "leave", label: "Leave", value: summary.leave, gradient: "from-blue-400/30 to-indigo-500/20" },
              { key: "absent", label: "Absent", value: summary.absent, gradient: "from-red-400/30 to-rose-500/20" },
            ] as const
          ).map((s) => (
            <div
              key={s.key}
              className={cn(
                "rounded-xl border border-white/10 bg-gradient-to-br px-3 py-2.5 backdrop-blur-sm",
                s.gradient
              )}
            >
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-emerald-100/80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent strip */}
      {recentDays.length > 0 && (
        <div className="dash-card p-4 overflow-hidden">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent days</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {recentDays.map((day) => {
              const meta = ATTENDANCE_STATUS[day.status];
              const Icon = meta.icon;
              const d = parseISO(day.date);
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    if (!isSameMonth(d, currentMonth)) setCurrentMonth(d);
                  }}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2 rounded-xl border px-3 py-2 transition-all hover:shadow-md",
                    meta.bg,
                    meta.border,
                    selectedKey === day.date && "ring-2 ring-green-500 ring-offset-1"
                  )}
                >
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-white/70", meta.text)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">{format(d, "MMM d")}</p>
                    <p className={cn("text-[10px] font-semibold", meta.text)}>{meta.fullLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 dash-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-xl font-bold text-gray-900">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goToday}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-green-50 text-green-800 border border-green-200 hover:bg-green-100 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                  <div
                    key={d}
                    className={cn(
                      "text-center text-[10px] font-bold uppercase tracking-wider py-2",
                      i === 5 ? "text-emerald-600" : "text-gray-400"
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((day) => {
                  const inMonth = isSameMonth(day, currentMonth);
                  if (!inMonth) {
                    return <div key={day.toISOString()} className="min-h-[56px] sm:min-h-[72px]" />;
                  }

                  const key = format(day, "yyyy-MM-dd");
                  const rec = records[key];
                  const status = rec?.status;
                  const meta = status ? ATTENDANCE_STATUS[status] : null;
                  const Icon = meta?.icon;
                  const selected = key === selectedKey;
                  const todayCell = isToday(day);
                  const isFriday = day.getDay() === 5;
                  const hifz = hifzByDay[key];
                  const hifzTypes = hifz
                    ? (Object.keys(hifz) as HifzLessonType[]).filter((t) => hifz[t])
                    : [];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "group relative min-h-[56px] sm:min-h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/40",
                        meta
                          ? cn(meta.bg, meta.border, "shadow-sm hover:shadow-md hover:-translate-y-0.5")
                          : "bg-gray-50/80 border-gray-100 text-gray-400 hover:bg-gray-100",
                        selected && "ring-2 ring-green-600 ring-offset-2 scale-[1.03] shadow-md z-10",
                        todayCell && !selected && "ring-2 ring-green-400/60",
                        isFriday && !meta && "bg-emerald-50/50 border-emerald-100"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-bold",
                          meta ? meta.text : isFriday ? "text-emerald-700" : "text-gray-500"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {Icon && meta && (
                        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-90", meta.text)} />
                      )}
                      {hifzTypes.length > 0 && (
                        <span className="flex items-center gap-0.5 mt-0.5">
                          {hifzTypes.map((t) => (
                            <span
                              key={t}
                              className={cn(
                                "inline-flex items-center justify-center h-3 min-w-[13px] px-0.5 rounded text-[7px] font-bold leading-none",
                                hifz![t] === "done" ? "bg-emerald-600/90 text-white" : "bg-rose-600/90 text-white"
                              )}
                            >
                              {HIFZ_LESSON_META[t].short}
                            </span>
                          ))}
                        </span>
                      )}
                      {todayCell && (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 pt-4 border-t border-gray-100">
                {(Object.keys(ATTENDANCE_STATUS) as AttStatus[]).map((s) => {
                  const meta = ATTENDANCE_STATUS[s];
                  const Icon = meta.icon;
                  return (
                    <span key={s} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <span className={cn("h-6 w-6 rounded-lg flex items-center justify-center", meta.bg, meta.text)}>
                        <Icon className="h-3 w-3" />
                      </span>
                      {meta.fullLabel}
                    </span>
                  );
                })}
                <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="h-6 w-6 rounded-lg bg-gray-100 border border-gray-200" />
                  Not marked
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
        <div className="lg:col-span-2 dash-card p-5 md:p-6 flex flex-col min-h-[320px]">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
            {format(selectedDate, "EEEE")}
          </p>
          <h4 className="font-display text-2xl font-bold text-gray-900 mt-0.5">
            {format(selectedDate, "MMMM d, yyyy")}
          </h4>

          <div className="flex-1 mt-5">
            {selectedRecord ? (
              <div
                className={cn(
                  "rounded-2xl border p-5 h-full flex flex-col",
                  ATTENDANCE_STATUS[selectedRecord.status].bg,
                  ATTENDANCE_STATUS[selectedRecord.status].border
                )}
              >
                {(() => {
                  const meta = ATTENDANCE_STATUS[selectedRecord.status];
                  const Icon = meta.icon;
                  const msg = MOTIVATION[selectedRecord.status];
                  return (
                    <>
                      <div className={cn("inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm mb-4", meta.text)}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className={cn("pill text-xs w-fit", meta.pill)}>{meta.fullLabel}</span>
                      <h5 className="font-semibold text-gray-900 mt-3">{msg.title}</h5>
                      <p className="text-sm text-gray-600 leading-relaxed mt-1 flex-1">{msg.body}</p>

                      {selectedRecord.status === "LEAVE" && (
                        <div className="mt-4 space-y-2">
                          {selectedRecord.leaveRequestedBy && (
                            <div className="rounded-xl bg-white/70 p-3 border border-white/80 text-sm">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase">Requested by</p>
                              <p className="font-medium text-gray-900">{selectedRecord.leaveRequestedBy}</p>
                            </div>
                          )}
                          {selectedRecord.leaveReason && (
                            <div className="rounded-xl bg-white/70 p-3 border border-white/80 text-sm">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase">Reason</p>
                              <p className="font-medium text-gray-900">{selectedRecord.leaveReason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-gray-50 to-white p-8">
                <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <CalendarCheck className="h-7 w-7 text-gray-300" />
                </div>
                <p className="font-semibold text-gray-700">No record yet</p>
                <p className="text-sm text-gray-400 mt-1 max-w-[200px]">
                  {isToday(selectedDate)
                    ? "Your teacher hasn't marked today's attendance yet."
                    : "Attendance wasn't recorded for this day."}
                </p>
              </div>
            )}
          </div>

          {summary.marked > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Monthly attendance</span>
                <span
                  className={cn(
                    "font-bold",
                    summary.rate >= 90 ? "text-green-600" : summary.rate >= 75 ? "text-amber-600" : "text-red-500"
                  )}
                >
                  {summary.rate}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    summary.rate >= 90 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                    summary.rate >= 75 ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                    "bg-gradient-to-r from-red-400 to-rose-500"
                  )}
                  style={{ width: `${summary.rate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
