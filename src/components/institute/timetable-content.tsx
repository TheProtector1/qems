"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ScheduleSlot = {
  day: string;
  startTime: string;
  endTime: string;
  subject?: string;
  room?: string;
};

type ClassRow = {
  id: string;
  name: string;
  code: string | null;
  programType: string;
  teacherName: string | null;
  enrollmentCount: number;
  schedule: ScheduleSlot[];
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export function TimetableContent({ readOnly = false }: { readOnly?: boolean }) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/timetable");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDays(data.days || []);
      setClasses(data.classes || []);
      if (!selectedId && data.classes?.[0]) {
        setSelectedId(data.classes[0].id);
        setDraft(data.classes[0].schedule || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectClass = (id: string) => {
    setSelectedId(id);
    const cls = classes.find((c) => c.id === id);
    setDraft(cls?.schedule ? [...cls.schedule] : []);
  };

  const addSlot = () => {
    setDraft((d) => [
      ...d,
      {
        day: days[0] || "MONDAY",
        startTime: "08:00",
        endTime: "09:00",
        subject: "",
        room: "",
      },
    ]);
  };

  const updateSlot = (idx: number, patch: Partial<ScheduleSlot>) => {
    setDraft((d) => d.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSlot = (idx: number) => {
    setDraft((d) => d.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/institute/timetable", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: selectedId, schedule: draft }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success("Timetable saved");
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedId ? { ...c, schedule: data.class?.schedule || draft } : c
        )
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading timetable…
      </div>
    );
  }

  const selected = classes.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary-700" /> Class Timetable
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Weekly schedule per class — parents see this on their portal
          </p>
        </div>
        {!readOnly && selectedId && (
          <button className="btn-primary text-xs py-2" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save schedule
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="dash-card bg-white overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-gray-900">Classes</h3>
          </div>
          <div className="divide-y divide-border max-h-[28rem] overflow-y-auto">
            {classes.length === 0 ? (
              <p className="p-4 text-xs text-gray-400">No classes yet.</p>
            ) : (
              classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClass(c.id)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selectedId === c.id ? "bg-primary-50 text-primary-900" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.teacherName || "No teacher"} · {c.schedule.length} slot
                    {c.schedule.length !== 1 ? "s" : ""}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="md:col-span-2 dash-card bg-white p-5 space-y-4">
          {!selected ? (
            <p className="text-sm text-gray-400">Select a class to edit its timetable.</p>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                <p className="text-xs text-gray-500">
                  {selected.programType}
                  {selected.code ? ` · ${selected.code}` : ""} · {selected.enrollmentCount} students
                </p>
              </div>

              {draft.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No periods scheduled yet.</p>
              ) : (
                <div className="space-y-2">
                  {draft.map((slot, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center rounded-lg border border-gray-100 p-2"
                    >
                      {readOnly ? (
                        <>
                          <span className="text-xs font-semibold col-span-1">
                            {DAY_LABELS[slot.day] || slot.day}
                          </span>
                          <span className="text-xs col-span-2">
                            {slot.startTime}–{slot.endTime}
                          </span>
                          <span className="text-xs col-span-2 truncate">{slot.subject || "—"}</span>
                          <span className="text-xs text-gray-400">{slot.room || ""}</span>
                        </>
                      ) : (
                        <>
                          <select
                            className="form-input text-xs"
                            value={slot.day}
                            onChange={(e) => updateSlot(idx, { day: e.target.value })}
                          >
                            {days.map((d) => (
                              <option key={d} value={d}>
                                {DAY_LABELS[d] || d}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            className="form-input text-xs"
                            value={slot.startTime}
                            onChange={(e) => updateSlot(idx, { startTime: e.target.value })}
                          />
                          <input
                            type="time"
                            className="form-input text-xs"
                            value={slot.endTime}
                            onChange={(e) => updateSlot(idx, { endTime: e.target.value })}
                          />
                          <input
                            className="form-input text-xs"
                            placeholder="Subject"
                            value={slot.subject || ""}
                            onChange={(e) => updateSlot(idx, { subject: e.target.value })}
                          />
                          <input
                            className="form-input text-xs"
                            placeholder="Room"
                            value={slot.room || ""}
                            onChange={(e) => updateSlot(idx, { room: e.target.value })}
                          />
                          <button
                            type="button"
                            className="text-gray-400 hover:text-red-600 justify-self-end p-1"
                            onClick={() => removeSlot(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!readOnly && (
                <button type="button" className="btn-ghost text-xs py-2" onClick={addSlot}>
                  <Plus className="h-4 w-4" /> Add period
                </button>
              )}

              {/* Week grid preview */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                  Week preview
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {days.slice(0, 7).map((d) => {
                    const slots = draft.filter((s) => s.day === d);
                    return (
                      <div key={d} className="rounded-lg bg-gray-50 p-2 min-h-[4rem]">
                        <p className="text-[10px] font-bold text-gray-500 mb-1">
                          {DAY_LABELS[d] || d}
                        </p>
                        {slots.length === 0 ? (
                          <p className="text-[10px] text-gray-300">—</p>
                        ) : (
                          slots.map((s, i) => (
                            <p key={i} className="text-[10px] text-gray-700 leading-snug">
                              {s.startTime} {s.subject || ""}
                            </p>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
