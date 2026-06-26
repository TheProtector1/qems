"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck, Save, CheckCircle2, X, Clock,
  AlertTriangle, Download,
  Loader2, RefreshCw, Users,
} from "lucide-react";
import { cn, formatDate, downloadCsv } from "@/lib/utils";
import { StudentAvatar } from "@/components/common/student-avatar";
import { StudentAttendanceCalendar } from "@/components/institute/student-attendance-calendar";
import { ATTENDANCE_STATUS, type AttStatus } from "@/lib/attendance-status";

type StudentRow = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender: string;
  programType: string;
};

const STATUS_CONFIG = ATTENDANCE_STATUS;

const PROGRAM_FILTERS = [
  { value: "ALL", label: "All Programs" },
  { value: "HIFZ", label: "Hifz" },
  { value: "NAZRA", label: "Nazra" },
  { value: "TAJWEED", label: "Tajweed" },
];

function programLabel(type: string) {
  if (type === "NAZRA") return "Nazra";
  if (type === "TAJWEED") return "Tajweed";
  return "Hifz";
}

export function AttendanceContent({ readOnly = false }: { readOnly?: boolean }) {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [programFilter, setProgramFilter] = useState("ALL");
  const [attendance, setAttendance] = useState<Record<string, AttStatus | null>>({});
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, Record<string, AttStatus>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mark" | "history" | "calendar">(readOnly ? "history" : "mark");

  const [leaveDetails, setLeaveDetails] = useState<Record<string, { reason: string; requestedBy: string }>>({});
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingLeaveStudentId, setPendingLeaveStudentId] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState({ reason: "", requestedBy: "" });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [calendarStudentId, setCalendarStudentId] = useState("");
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (programFilter !== "ALL") params.set("program", programFilter);

      const res = await fetch(`/api/institute/attendance?${params}`);
      if (!res.ok) throw new Error("Failed to load attendance data.");

      const data = await res.json();
      setStudents(data.students || []);
      setHistoryDates(data.historyDates || []);
      setHistory(data.history || {});

      const initial: Record<string, AttStatus | null> = {};
      for (const s of data.students || []) {
        initial[s.id] = data.attendance?.[s.id] || null;
      }
      setAttendance(initial);

      setCalendarStudentId((prev) => prev || data.students?.[0]?.id || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, programFilter]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const markAll = (status: AttStatus) => {
    const all: Record<string, AttStatus | null> = {};
    students.forEach((s) => (all[s.id] = status));
    setAttendance(all);
  };

  const toggle = (id: string, status: AttStatus) => {
    if (status === "LEAVE" && attendance[id] !== "LEAVE") {
      setPendingLeaveStudentId(id);
      setLeaveForm({ reason: "", requestedBy: "" });
      setLeaveModalOpen(true);
      return;
    }

    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === status ? null : status,
    }));

    if (status !== "LEAVE") {
      setLeaveDetails((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const summary = useMemo(() => ({
    present: Object.values(attendance).filter((v) => v === "PRESENT").length,
    absent: Object.values(attendance).filter((v) => v === "ABSENT").length,
    late: Object.values(attendance).filter((v) => v === "LATE").length,
    leave: Object.values(attendance).filter((v) => v === "LEAVE").length,
    total: students.length,
    marked: Object.values(attendance).filter(Boolean).length,
  }), [attendance, students.length]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const records = Object.entries(attendance)
        .filter(([, status]) => status)
        .map(([studentId, status]) => ({ 
          studentId, 
          status: status as AttStatus,
          leaveReason: leaveDetails[studentId]?.reason,
          leaveRequestedBy: leaveDetails[studentId]?.requestedBy,
        }));

      const res = await fetch("/api/institute/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, records }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save attendance.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      loadAttendance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const headers = ["Student ID", "Name", ...historyDates];
    const rows = students.map((s) => [
      s.studentId,
      s.fullName,
      ...historyDates.map((d) => history[s.id]?.[d] || ""),
    ]);
    downloadCsv(`attendance-${selectedDate}.csv`, headers, rows);
  };

  const handleDeleteRecord = async () => {
    if (!editRecordId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/institute/attendance?id=${editRecordId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record.");
      setEditModalOpen(false);
      loadAttendance();
      setCalendarRefresh((n) => n + 1);
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header-row">
        <div>
          <h2 className="section-heading">Attendance</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {students.length} enrolled student{students.length !== 1 ? "s" : ""} • live database records
          </p>
        </div>
        {!readOnly && (
          <div className="page-header-actions">
            <button className="btn-ghost text-sm py-2" onClick={loadAttendance} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </button>
            <button className="btn-ghost text-sm py-2" onClick={handleExport} disabled={!students.length}>
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !students.length}
              id="btn-save-attendance"
              className="btn-primary text-sm py-2"
            >
              {saved ? (
                <><CheckCircle2 className="h-4 w-4" /> Saved!</>
              ) : saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4" /> Save Attendance</>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present", count: summary.present, color: "bg-green-50 text-green-700", icon: CheckCircle2 },
          { label: "Absent", count: summary.absent, color: "bg-red-50 text-red-700", icon: X },
          { label: "Late", count: summary.late, color: "bg-amber-50 text-amber-700", icon: Clock },
          { label: "Leave", count: summary.leave, color: "bg-blue-50 text-blue-700", icon: AlertTriangle },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={cn("rounded-2xl p-4 flex items-center gap-3 border border-current/10", c.color.split(" ")[0])}>
              <Icon className={cn("h-8 w-8 opacity-70", c.color.split(" ")[1])} />
              <div>
                <p className={cn("font-display text-3xl font-bold", c.color.split(" ")[1])}>{c.count}</p>
                <p className={cn("text-xs", c.color.split(" ")[1])}>{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {[
          ...(!readOnly ? [{ key: "mark", label: "Mark Attendance" }] : []),
          { key: "history", label: "History Table" },
          { key: "calendar", label: "Student Calendar" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            id={`tab-${t.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading students...
        </div>
      )}

      {!loading && students.length === 0 && (
        <div className="dash-card p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No students found</h3>
          <p className="text-sm text-gray-500">Add students from the Students page to mark attendance.</p>
        </div>
      )}

      {!loading && students.length > 0 && !readOnly && activeTab === "mark" && (
        <div className="dash-card overflow-hidden">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input w-44"
            />
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="form-input w-48"
              id="select-program"
            >
              {PROGRAM_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-2 ml-auto flex-wrap">
              <span className="text-xs text-gray-500 self-center">Mark all:</span>
              {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as AttStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => markAll(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      s === "PRESENT" && "border-green-200 text-green-700 bg-green-50 hover:bg-green-100",
                      s === "ABSENT" && "border-red-200 text-red-700 bg-red-50 hover:bg-red-100",
                      s === "LATE" && "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100",
                      s === "LEAVE" && "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100",
                    )}
                  >
                    All {cfg.fullLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{summary.marked}/{summary.total} marked for {formatDate(selectedDate)}</span>
              <span>{summary.total ? Math.round((summary.marked / summary.total) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                style={{ width: `${summary.total ? (summary.marked / summary.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-border mt-4">
            {students.map((student, i) => {
              const current = attendance[student.id];
              return (
                <div key={student.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                  <StudentAvatar
                    name={student.fullName}
                    gender={student.gender}
                    photo={student.photo}
                    size="sm"
                    rounded="full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                    <p className="text-xs text-gray-400 font-mono">{student.studentId} · {programLabel(student.programType)}</p>
                  </div>
                  <div className="flex gap-2">
                    {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as const).map((status) => {
                      const cfg = STATUS_CONFIG[status];
                      const isActive = current === status;
                      return (
                        <button
                          key={status}
                          onClick={() => toggle(student.id, status)}
                          title={cfg.fullLabel}
                          className={cn(
                            "w-10 h-10 rounded-xl font-bold text-xs transition-all duration-150 ring-2 ring-transparent",
                            isActive ? cfg.btn + " ring-offset-1 scale-105" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                          )}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  {current && (
                    <span className={cn("pill text-xs", STATUS_CONFIG[current].pill)}>
                      {STATUS_CONFIG[current].fullLabel}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && students.length > 0 && activeTab === "history" && (
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  {historyDates.map((d) => (
                    <th key={d} className="text-center whitespace-nowrap">
                      {new Date(d + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </th>
                  ))}
                  <th className="text-center">Rate</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const dates = historyDates.map((d) => history[s.id]?.[d] || null);
                  const marked = dates.filter(Boolean);
                  const presentCount = dates.filter((d) => d === "PRESENT").length;
                  const rate = marked.length ? Math.round((presentCount / marked.length) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <StudentAvatar name={s.fullName} gender={s.gender} photo={s.photo} size="sm" rounded="full" />
                          <span className="font-medium text-gray-900 whitespace-nowrap text-sm">{s.fullName}</span>
                        </div>
                      </td>
                      {dates.map((status, di) => (
                        <td key={di} className="text-center">
                          {status ? (
                            <span className={cn(
                              "inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold",
                              STATUS_CONFIG[status].cal
                            )}>
                              {STATUS_CONFIG[status].label}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      ))}
                      <td className="text-center">
                        <span className={cn(
                          "font-bold text-sm",
                          rate >= 90 ? "text-green-600" : rate >= 75 ? "text-amber-600" : marked.length ? "text-red-500" : "text-gray-400"
                        )}>
                          {marked.length ? `${rate}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && students.length > 0 && activeTab === "calendar" && calendarStudentId && (
        <StudentAttendanceCalendar
          key={`${calendarStudentId}-${calendarRefresh}`}
          studentId={calendarStudentId}
          apiScope="institute"
          students={students}
          selectedStudentId={calendarStudentId}
          onStudentChange={setCalendarStudentId}
          student={students.find((s) => s.id === calendarStudentId)}
          readOnly={readOnly}
          onDayClick={
            !readOnly
              ? (rec) => {
                  if (rec.id) {
                    setEditRecordId(rec.id);
                    setEditModalOpen(true);
                  }
                }
              : undefined
          }
        />
      )}

      {!readOnly && leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="font-display font-bold text-gray-900 mb-1">Leave Details</h3>
            <p className="text-sm text-gray-500 mb-4">Provide details for this leave request.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Requested By</label>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="e.g. Father, Mother, Self"
                  value={leaveForm.requestedBy}
                  onChange={e => setLeaveForm({ ...leaveForm, requestedBy: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  className="form-input w-full"
                  placeholder="e.g. Sick, Family Event"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="btn-ghost flex-1 py-2"
                  onClick={() => setLeaveModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary flex-1 py-2"
                  onClick={() => {
                    if (pendingLeaveStudentId) {
                      setAttendance(prev => ({ ...prev, [pendingLeaveStudentId]: "LEAVE" }));
                      setLeaveDetails(prev => ({ ...prev, [pendingLeaveStudentId]: leaveForm }));
                    }
                    setLeaveModalOpen(false);
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!readOnly && editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-gray-900 mb-2">Manage Record</h3>
            <p className="text-sm text-gray-500 mb-4">Do you want to delete this attendance record? This action cannot be undone.</p>
            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-ghost flex-1 py-2"
                onClick={() => { setEditModalOpen(false); setDeleteError(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger flex-1 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg font-semibold transition-colors"
                disabled={deleting}
                onClick={handleDeleteRecord}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
