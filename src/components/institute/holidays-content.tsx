"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Palmtree,
  Plus,
  Trash2,
  Loader2,
  Save,
  Calendar,
  Download,
  CheckCircle2,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { WEEKDAY_LABELS } from "@/lib/weekday-labels";

type HolidayRow = {
  id: string;
  type: "WEEKLY" | "PUBLIC" | "SCHEDULED";
  name: string;
  dayOfWeek: number | null;
  dayLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
};

const TYPE_LABELS: Record<HolidayRow["type"], string> = {
  WEEKLY: "Weekly Off",
  PUBLIC: "Public Holiday",
  SCHEDULED: "Scheduled Break",
};

export function HolidaysContent() {
  const [holidays, setHolidays] = useState<HolidayRow[]>([]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingWeekly, setSavingWeekly] = useState(false);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importYear, setImportYear] = useState(new Date().getFullYear());

  const [form, setForm] = useState({
    type: "SCHEDULED" as "PUBLIC" | "SCHEDULED",
    name: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/holidays");
      if (!res.ok) throw new Error("Failed to load holidays");
      const data = await res.json();
      setHolidays(data.holidays || []);
      setWeeklyOffDays(data.weeklyOffDays || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const toggleWeeklyDay = (day: number) => {
    setWeeklyOffDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  };

  const saveWeekly = async () => {
    setSavingWeekly(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-weekly", weeklyOffDays }),
      });
      if (!res.ok) throw new Error("Failed to save weekly holidays");
      const data = await res.json();
      setHolidays(data.holidays || []);
      setWeeklyOffDays(data.weeklyOffDays || []);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save weekly holidays");
    } finally {
      setSavingWeekly(false);
    }
  };

  const importPakistanHolidays = async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import-pakistan-public", year: importYear }),
      });
      if (!res.ok) throw new Error("Failed to import public holidays");
      await loadHolidays();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import holidays");
    } finally {
      setImporting(false);
    }
  };

  const addHoliday = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) {
      setError("Name, start date, and end date are required.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          name: form.name.trim(),
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add holiday");
      }
      setForm({ type: "SCHEDULED", name: "", startDate: "", endDate: "", notes: "" });
      await loadHolidays();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add holiday");
    } finally {
      setAdding(false);
    }
  };

  const deleteHoliday = async (id: string) => {
    if (!confirm("Delete this holiday? Attendance marked as Holiday for these dates will be cleared.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/institute/holidays/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete holiday");
      await loadHolidays();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete holiday");
    }
  };

  const datedHolidays = holidays.filter(
    (h) => h.isActive && (h.type === "PUBLIC" || h.type === "SCHEDULED")
  );

  return (
    <div className="space-y-6">
      <div className="page-header-row">
        <div>
          <h2 className="section-heading flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-primary-700" />
            Holiday Management
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure weekly off days and public holidays. Attendance is automatically marked as Holiday.
          </p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading holidays...
        </div>
      ) : (
        <>
          <div className="dash-card p-6 bg-white space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Weekly Off Days</h3>
                <p className="text-xs text-gray-500 mt-0.5">Recurring holidays every week (e.g. Sunday)</p>
              </div>
              <button
                className="btn-primary text-xs py-2"
                onClick={saveWeekly}
                disabled={savingWeekly}
              >
                {savingWeekly ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Weekly</>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {WEEKDAY_LABELS.map((label, day) => {
                const active = weeklyOffDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeeklyDay(day)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-xs font-semibold transition-colors",
                      active
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    {label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dash-card p-6 bg-white space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Pakistan Public Holidays</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Import fixed national holidays (Islamic dates like Eid must be added manually)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="form-input w-28 text-xs"
                  value={importYear}
                  onChange={(e) => setImportYear(Number(e.target.value))}
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  className="btn-ghost text-xs py-2"
                  onClick={importPakistanHolidays}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Import
                </button>
              </div>
            </div>
          </div>

          <div className="dash-card p-6 bg-white space-y-5">
            <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Add Scheduled / Public Holiday</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
                <select
                  className="form-input text-xs"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PUBLIC" | "SCHEDULED" }))}
                >
                  <option value="PUBLIC">Public Holiday</option>
                  <option value="SCHEDULED">Scheduled Break</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Name</label>
                <input
                  className="form-input text-xs"
                  placeholder="e.g. Eid-ul-Fitr"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Start Date</label>
                <input
                  type="date"
                  className="form-input text-xs"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value, endDate: f.endDate || e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  className="form-input text-xs"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <input
                  className="form-input text-xs"
                  placeholder="Additional details"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <button className="btn-primary text-xs py-2" onClick={addHoliday} disabled={adding}>
              {adding ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                <><Plus className="h-4 w-4" /> Add Holiday</>
              )}
            </button>
          </div>

          <div className="dash-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">
                Scheduled & Public Holidays ({datedHolidays.length})
              </h3>
            </div>
            {datedHolidays.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No dated holidays yet. Import Pakistan public holidays or add custom dates above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Notes</th>
                      <th className="w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {datedHolidays.map((h) => (
                      <tr key={h.id}>
                        <td className="font-medium text-gray-900">{h.name}</td>
                        <td>
                          <span className="pill text-xs">{TYPE_LABELS[h.type]}</span>
                        </td>
                        <td className="text-sm text-gray-600 whitespace-nowrap">
                          {h.startDate === h.endDate
                            ? formatDate(h.startDate!)
                            : `${formatDate(h.startDate!)} – ${formatDate(h.endDate!)}`}
                        </td>
                        <td className="text-xs text-gray-500 max-w-[200px] truncate">{h.notes || "—"}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => deleteHoliday(h.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete holiday"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
