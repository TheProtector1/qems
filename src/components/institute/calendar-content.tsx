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
  parseISO
} from "date-fns";
import { Plus, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { dateKeyInAppTz, parseDateOnly, todayDateKey } from "@/lib/timezone";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  type: "HOLIDAY" | "EXAM" | "EVENT" | "ACADEMIC";
};

const EVENT_TYPE_COLORS = {
  HOLIDAY: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Holiday" },
  EXAM: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Exam" },
  EVENT: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Event" },
  ACADEMIC: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Academic" },
};

export function CalendarContent() {
  const [currentMonth, setCurrentMonth] = useState(() => parseDateOnly(todayDateKey()));
  const [selectedDate, setSelectedDate] = useState(() => parseDateOnly(todayDateKey()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("ACADEMIC");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/institute/calendar");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openNewModal = (date?: Date) => {
    const defaultDateStr = date ? dateKeyInAppTz(date) : dateKeyInAppTz(selectedDate);
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setStartDate(defaultDateStr);
    setEndDate(defaultDateStr);
    setType("ACADEMIC");
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setStartDate(event.startDate ? event.startDate.split("T")[0] : "");
    setEndDate(event.endDate ? event.endDate.split("T")[0] : "");
    setType(event.type);
    setIsModalOpen(true);
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { title, description, startDate, endDate, type };
      
      let res;
      if (editingEvent) {
        res = await fetch(`/api/institute/calendar/${editingEvent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/institute/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        fetchEvents();
        setIsModalOpen(false);
      } else {
        alert("Failed to save event. Check that all fields are filled correctly.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const res = await fetch(`/api/institute/calendar/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchEvents();
      } else {
        alert("Failed to delete event.");
      }
    } catch (error) {
      console.error(error);
    }
  };

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
    return events.filter(event => {
      const start = parseISO(event.startDate);
      const end = parseISO(event.endDate);
      // Strip time parts for comparisons
      const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const eventStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const eventEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      return current >= eventStart && current <= eventEnd;
    });
  };

  const selectedDayEvents = getEventsForDate(selectedDate);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading calendar events...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Academic Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage holidays, exam schedules, and institute-wide events.
          </p>
        </div>
        <button onClick={() => openNewModal()} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

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

        {/* Event List/Details sidebar */}
        <div className="dash-card p-5 flex flex-col h-full justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-4">
              <h3 className="font-semibold text-gray-900">
                Events for {format(selectedDate, "MMM dd, yyyy")}
              </h3>
              <button 
                onClick={() => openNewModal(selectedDate)}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
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
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider block mb-1">
                        {EVENT_TYPE_COLORS[event.type].label}
                      </span>
                      <h4 className="font-semibold text-sm leading-tight text-gray-900">{event.title}</h4>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(event)} className="p-1 hover:bg-black/5 rounded">
                        <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                      <button onClick={() => deleteEvent(event.id)} className="p-1 hover:bg-black/5 rounded">
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-xs mt-2 text-gray-600 whitespace-pre-line">{event.description}</p>
                  )}
                  <div className="mt-3 pt-2 border-t border-black/5 flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {format(parseISO(event.startDate), "MMM dd")} - {format(parseISO(event.endDate), "MMM dd")}
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

      {/* Add/Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </h3>
            <form onSubmit={saveEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., Eid-ul-Adha Holidays"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as CalendarEvent["type"])}
                  className="form-input w-full"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="EXAM">Exam</option>
                  <option value="EVENT">Event/Activity</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-input w-full"
                  placeholder="Optional details, breaks info..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEvent ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
