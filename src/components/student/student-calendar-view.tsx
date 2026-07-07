"use client";

import { useState, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isBefore,
  differenceInCalendarDays,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  PartyPopper,
  BookOpen,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type CalendarEvent,
  eventSpansDate,
  normalizeCalendarEvents,
  parseEventDate,
  safeFormatEventDate,
} from "@/lib/calendar-events";
import { parseDateOnly, todayDateKey } from "@/lib/timezone";

type EventFilter = "ALL" | CalendarEvent["type"];

const EVENT_META = {
  HOLIDAY: {
    label: "Holiday",
    icon: PartyPopper,
    gradient: "from-rose-500 to-red-600",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-800",
  },
  EXAM: {
    label: "Exam",
    icon: GraduationCap,
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800",
  },
  EVENT: {
    label: "Event",
    icon: Sparkles,
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-800",
  },
  ACADEMIC: {
    label: "Academic",
    icon: BookOpen,
    gradient: "from-emerald-500 to-green-700",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800",
  },
} as const;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isTodayInPakistan(date: Date) {
  return format(date, "yyyy-MM-dd") === todayDateKey();
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-2xl bg-gray-200" />
      <div className="h-24 rounded-2xl bg-gray-100" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 rounded-2xl bg-gray-100" />
        <div className="h-96 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

export function StudentCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => parseDateOnly(todayDateKey()));
  const [selectedDate, setSelectedDate] = useState(() => parseDateOnly(todayDateKey()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<EventFilter>("ALL");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/calendar");
        if (res.ok) {
          const data = await res.json();
          setEvents(normalizeCalendarEvents(data));
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(
    () => (typeFilter === "ALL" ? events : events.filter((e) => e.type === typeFilter)),
    [events, typeFilter]
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const getEventsForDate = (date: Date) =>
    filteredEvents.filter((event) => eventSpansDate(event, date));

  const selectedDayEvents = getEventsForDate(selectedDate);

  const monthStats = useMemo(() => {
    const inMonth = filteredEvents.filter((e) => {
      const start = parseEventDate(e.startDate);
      return start ? isSameMonth(start, currentMonth) || eventSpansDate(e, monthStart) : false;
    });
    return {
      total: inMonth.length,
      holidays: inMonth.filter((e) => e.type === "HOLIDAY").length,
      exams: inMonth.filter((e) => e.type === "EXAM").length,
      events: inMonth.filter((e) => e.type === "EVENT" || e.type === "ACADEMIC").length,
    };
  }, [filteredEvents, currentMonth, monthStart]);

  const upcomingEvents = useMemo(() => {
    const today = parseDateOnly(todayDateKey());
    return events
      .filter((e) => {
        const end = parseEventDate(e.endDate);
        return end ? !isBefore(end, today) : false;
      })
      .sort((a, b) => {
        const aStart = parseEventDate(a.startDate)?.getTime() ?? 0;
        const bStart = parseEventDate(b.startDate)?.getTime() ?? 0;
        return aStart - bStart;
      })
      .slice(0, 6);
  }, [events]);

  const nextEvent = upcomingEvents[0];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-green-800 to-emerald-900 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_50%)]" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-100 mb-3">
              <Calendar className="h-3.5 w-3.5" /> Your Institute Calendar
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <p className="text-emerald-100/90 text-sm mt-2 max-w-lg">
              Track holidays, exams, and important dates — never miss what matters for your learning journey.
            </p>
          </div>
          {nextEvent && (
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4 min-w-[220px]">
              <p className="text-[10px] uppercase tracking-wider text-emerald-200 font-semibold">Coming up next</p>
              <p className="font-semibold mt-1 line-clamp-1">{nextEvent.title}</p>
              <p className="text-xs text-emerald-100/80 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {safeFormatEventDate(nextEvent.startDate, "EEE, MMM d")}
                {nextEvent.startDate !== nextEvent.endDate &&
                  ` – ${safeFormatEventDate(nextEvent.endDate, "MMM d")}`}
              </p>
            </div>
          )}
        </div>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: "This Month", value: monthStats.total },
            { label: "Holidays", value: monthStats.holidays },
            { label: "Exams", value: monthStats.exams },
            { label: "Activities", value: monthStats.events },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 border border-white/10 px-4 py-3">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[11px] text-emerald-100/80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming strip */}
      {upcomingEvents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming</h3>
            <span className="text-xs text-gray-400">{upcomingEvents.length} scheduled</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {upcomingEvents.map((event) => {
              const meta = EVENT_META[event.type];
              if (!meta) return null;
              const Icon = meta.icon;
              const start = parseEventDate(event.startDate);
              const daysUntil = start
                ? differenceInCalendarDays(start, parseDateOnly(todayDateKey()))
                : null;
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    if (!start) return;
                    setSelectedDate(start);
                    setCurrentMonth(start);
                  }}
                  className={cn(
                    "snap-start flex-shrink-0 w-56 text-left rounded-2xl border p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
                    meta.bg,
                    meta.border
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/70", meta.text)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={cn("pill text-[9px] py-0", meta.chip)}>{meta.label}</span>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 mt-3 line-clamp-2">{event.title}</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {safeFormatEventDate(event.startDate, "MMM d")}
                    {event.startDate !== event.endDate &&
                      ` – ${safeFormatEventDate(event.endDate, "MMM d")}`}
                  </p>
                  {daysUntil != null && daysUntil >= 0 && daysUntil <= 14 && (
                    <p className="text-[10px] font-semibold mt-2 text-gray-600">
                      {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter("ALL")}
          className={cn(
            "pill text-xs transition-all",
            typeFilter === "ALL" ? "pill-primary" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All events
        </button>
        {(Object.keys(EVENT_META) as CalendarEvent["type"][]).map((type) => {
          const meta = EVENT_META[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={cn(
                "pill text-xs transition-all inline-flex items-center gap-1",
                typeFilter === type ? meta.chip + " ring-2 ring-offset-1 ring-current" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 dash-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-gray-900">{format(currentMonth, "MMMM yyyy")}</h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = parseDateOnly(todayDateKey());
                  setCurrentMonth(now);
                  setSelectedDate(now);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={cn(
                  "text-center text-[11px] font-semibold uppercase tracking-wider py-2",
                  i === 5 ? "text-emerald-600" : "text-gray-400"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {days.map((day) => {
              const dayEvents = getEventsForDate(day);
              const selected = isSameDay(day, selectedDate);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isTodayInPakistan(day);
              const isFriday = day.getDay() === 5;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative min-h-[72px] md:min-h-[88px] rounded-xl border p-2 text-left transition-all",
                    "hover:shadow-sm hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500/30",
                    !inMonth && "opacity-40 bg-gray-50/50 border-gray-100",
                    inMonth && !selected && "bg-white border-gray-100",
                    selected && "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm ring-2 ring-green-500/20",
                    isFriday && inMonth && !selected && "bg-emerald-50/30 border-emerald-100/60"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      today && "bg-green-600 text-white shadow-sm",
                      selected && !today && "bg-green-100 text-green-800",
                      !today && !selected && "text-gray-700"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 4).map((event) => (
                      <span
                        key={event.id}
                        className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", EVENT_META[event.type].dot)}
                        title={event.title}
                      />
                    ))}
                  </div>

                  {dayEvents.length > 0 && (
                    <p className="hidden md:block text-[9px] text-gray-500 mt-1 line-clamp-1 font-medium">
                      {dayEvents[0].title}
                      {dayEvents.length > 1 && ` +${dayEvents.length - 1}`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="dash-card p-5 flex-1">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100 mb-4">
              <div>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                  {format(selectedDate, "EEEE")}
                </p>
                <h3 className="font-display text-xl font-bold text-gray-900 mt-0.5">
                  {format(selectedDate, "MMMM d, yyyy")}
                </h3>
                {isTodayInPakistan(selectedDate) && (
                  <span className="pill pill-success text-[10px] py-0 mt-2 inline-flex">Today</span>
                )}
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white font-display font-bold text-lg shadow-sm">
                {format(selectedDate, "d")}
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {selectedDayEvents.map((event) => {
                const meta = EVENT_META[event.type];
                if (!meta) return null;
                const Icon = meta.icon;
                return (
                  <div
                    key={event.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all hover:shadow-sm",
                      meta.bg,
                      meta.border
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-white/80 flex-shrink-0", meta.text)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("pill text-[9px] py-0", meta.chip)}>{meta.label}</span>
                        <h4 className="font-semibold text-gray-900 mt-1 leading-snug">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                            {event.description}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-500 mt-3 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {safeFormatEventDate(event.startDate, "MMM d")}
                          {event.startDate !== event.endDate &&
                            ` – ${safeFormatEventDate(event.endDate, "MMM d, yyyy")}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedDayEvents.length === 0 && (
                <div className="py-12 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="h-8 w-8 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-700">No events on this day</p>
                  <p className="text-xs text-gray-400 mt-1">Select another date or browse upcoming events above.</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="dash-card p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Event types</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(EVENT_META) as [CalendarEvent["type"], typeof EVENT_META.HOLIDAY][]).map(
                ([type, meta]) => (
                  <div key={type} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", meta.dot)} />
                    {meta.label}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {events.length === 0 && (
        <div className="dash-card p-10 text-center border-dashed">
          <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-gray-900">Calendar is empty for now</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Your institute hasn&apos;t added events yet. Check back later for holidays, exams, and activities.
          </p>
        </div>
      )}
    </div>
  );
}
