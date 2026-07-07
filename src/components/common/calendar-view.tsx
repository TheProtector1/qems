"use client";

import { useState, useEffect } from "react";
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
} from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  eventSpansDate,
  normalizeCalendarEvents,
  parseEventDate,
  safeFormatEventDate,
  type CalendarEvent,
} from "@/lib/calendar-events";
import { parseDateOnly, todayDateKey } from "@/lib/timezone";

const EVENT_TYPE_COLORS = {
  HOLIDAY: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Holiday" },
  EXAM: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Exam" },
  EVENT: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Event" },
  ACADEMIC: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Academic" },
};

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(() => parseDateOnly(todayDateKey()));
  const [selectedDate, setSelectedDate] = useState(() => parseDateOnly(todayDateKey()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Helper date generators for the calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDateOfWeek = startOfWeek(monthStart);
  const endDateOfWeek = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDateOfWeek,
    end: endDateOfWeek,
  });

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => eventSpansDate(event, date));
  };

  const selectedDayEvents = getEventsForDate(selectedDate);

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading calendar events...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 dash-card p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-center font-semibold text-xs text-gray-500 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-lg overflow-hidden">
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "min-h-[90px] p-2 border-r border-b border-gray-100 cursor-pointer flex flex-col justify-between transition-all hover:bg-gray-50",
                  isSelected && "bg-primary-50/50 hover:bg-primary-50",
                  !isCurrentMonth && "bg-gray-50/30 text-gray-400"
                )}
              >
                <div className="flex justify-between items-center">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    isSameDay(day, new Date()) && "bg-primary-500 text-white",
                    isSelected && !isSameDay(day, new Date()) && "text-primary-600 bg-primary-100/50",
                    isCurrentMonth && !isSelected && !isSameDay(day, new Date()) && "text-gray-700"
                  )}>
                    {format(day, "d")}
                  </span>
                </div>

                {/* Badges/Dots for events */}
                <div className="mt-2 space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div 
                      key={event.id}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded truncate border font-medium",
                        EVENT_TYPE_COLORS[event.type].bg
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[9px] text-gray-400 font-medium pl-1">
                      + {dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Sidebar */}
      <div className="dash-card p-5 flex flex-col h-full justify-between">
        <div>
          <div className="pb-4 border-b border-gray-100 mb-4">
            <h3 className="font-semibold text-gray-900">
              Events for {format(selectedDate, "MMM dd, yyyy")}
            </h3>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
            {selectedDayEvents.map(event => (
              <div 
                key={event.id}
                className={cn(
                  "p-3 rounded-xl border flex flex-col justify-between hover:shadow-sm transition-all",
                  EVENT_TYPE_COLORS[event.type].bg
                )}
              >
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider block mb-1">
                    {EVENT_TYPE_COLORS[event.type].label}
                  </span>
                  <h4 className="font-semibold text-sm leading-tight text-gray-900">{event.title}</h4>
                </div>
                {event.description && (
                  <p className="text-xs mt-2 text-gray-600 whitespace-pre-line">{event.description}</p>
                )}
                <div className="mt-3 pt-2 border-t border-black/5 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {safeFormatEventDate(event.startDate, "MMM dd")} - {safeFormatEventDate(event.endDate, "MMM dd")}
                  </span>
                </div>
              </div>
            ))}

            {selectedDayEvents.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No events scheduled for this day.</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Event Types</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(EVENT_TYPE_COLORS).map(([typeKey, details]) => (
              <div key={typeKey} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={cn("h-2.5 w-2.5 rounded-full", details.dot)} />
                {details.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
