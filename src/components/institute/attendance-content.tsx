"use client";

import { useState } from "react";
import {
  CalendarCheck, Save, CheckCircle2, X, Clock,
  AlertTriangle, Users, TrendingUp, Download,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";

type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE" | null;

const STUDENTS = [
  { id: "1", name: "Ahmad Raza Khan", studentId: "STU-2024-0001" },
  { id: "2", name: "Fatima Noor Hussain", studentId: "STU-2024-0002" },
  { id: "3", name: "Usman Ali Siddiqui", studentId: "STU-2024-0003" },
  { id: "4", name: "Zainab Hassan Malik", studentId: "STU-2024-0004" },
  { id: "5", name: "Ibrahim Sheikh Rahman", studentId: "STU-2024-0005" },
  { id: "6", name: "Maryam Tariq Butt", studentId: "STU-2024-0006" },
  { id: "7", name: "Hamza Khalid Ansari", studentId: "STU-2024-0007" },
  { id: "8", name: "Sara Ijaz Chaudhry", studentId: "STU-2024-0008" },
  { id: "9", name: "Bilal Yousuf Qureshi", studentId: "STU-2024-0009" },
  { id: "10", name: "Nadia Rehman Shah", studentId: "STU-2024-0010" },
];

const STATUS_CONFIG = {
  PRESENT: { label: "P", fullLabel: "Present", icon: CheckCircle2, color: "bg-green-500 text-white ring-green-300", pill: "pill-success" },
  ABSENT: { label: "A", fullLabel: "Absent", icon: X, color: "bg-red-500 text-white ring-red-300", pill: "pill-danger" },
  LATE: { label: "L", fullLabel: "Late", icon: Clock, color: "bg-amber-500 text-white ring-amber-300", pill: "pill-warning" },
  LEAVE: { label: "LV", fullLabel: "Leave", icon: AlertTriangle, color: "bg-blue-500 text-white ring-blue-300", pill: "pill-info" },
};

const CLASSES = ["Hifz A", "Hifz B", "Hifz C", "Nazra 1", "Tajweed Advanced"];

const PAST_DATES = ["2025-06-14", "2025-06-13", "2025-06-12", "2025-06-11", "2025-06-10"];

export function AttendanceContent() {
  const [selectedClass, setSelectedClass] = useState("Hifz A");
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"mark" | "history">("mark");

  const today = new Date().toISOString().split("T")[0];

  const markAll = (status: AttStatus) => {
    const all: Record<string, AttStatus> = {};
    STUDENTS.forEach((s) => (all[s.id] = status));
    setAttendance(all);
  };

  const toggle = (id: string, status: AttStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [id]: prev[id] === status ? null : status,
    }));
  };

  const summary = {
    present: Object.values(attendance).filter((v) => v === "PRESENT").length,
    absent: Object.values(attendance).filter((v) => v === "ABSENT").length,
    late: Object.values(attendance).filter((v) => v === "LATE").length,
    leave: Object.values(attendance).filter((v) => v === "LEAVE").length,
    total: STUDENTS.length,
    marked: Object.values(attendance).filter(Boolean).length,
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Mock history
  const history = STUDENTS.map((s) => ({
    ...s,
    dates: PAST_DATES.map(() =>
      (["PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE"] as AttStatus[])[Math.floor(Math.random() * 5)]
    ),
  }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Attendance</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatDate(today)} • {selectedClass}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm py-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleSave}
            id="btn-save-attendance"
            className="btn-primary text-sm py-2"
          >
            {saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4" /> Save Attendance</>
            )}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present", count: summary.present, color: "bg-green-50 text-green-700", icon: CheckCircle2 },
          { label: "Absent", count: summary.absent, color: "bg-red-50 text-red-700", icon: X },
          { label: "Late", count: summary.late, color: "bg-amber-50 text-amber-700", icon: Clock },
          { label: "Leave", count: summary.leave, color: "bg-blue-50 text-blue-700", icon: AlertTriangle },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={cn("rounded-2xl p-4 flex items-center gap-3", c.color.split(" ")[0] + " border border-current/10")}>
              <Icon className={cn("h-8 w-8 opacity-70", c.color.split(" ")[1])} />
              <div>
                <p className={cn("font-display text-3xl font-bold", c.color.split(" ")[1])}>{c.count}</p>
                <p className={cn("text-xs", c.color.split(" ")[1])}>{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "mark", label: "✏️ Mark Attendance" },
          { key: "history", label: "📅 Attendance History" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
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

      {activeTab === "mark" && (
        <div className="dash-card overflow-hidden">
          {/* Controls */}
          <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-input w-48"
              id="select-class"
            >
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <div className="flex gap-2 ml-auto">
              <span className="text-xs text-gray-500 self-center">Mark all:</span>
              {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as AttStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s!];
                return (
                  <button
                    key={s}
                    onClick={() => markAll(s)}
                    id={`btn-mark-all-${s?.toLowerCase()}`}
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

          {/* Progress bar */}
          <div className="px-5 pt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{summary.marked}/{summary.total} marked</span>
              <span>{Math.round((summary.marked / summary.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                style={{ width: `${(summary.marked / summary.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Student rows */}
          <div className="divide-y divide-border mt-4">
            {STUDENTS.map((student, i) => {
              const current = attendance[student.id];
              return (
                <div
                  key={student.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                  <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{getInitials(student.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{student.studentId}</p>
                  </div>

                  {/* Status buttons */}
                  <div className="flex gap-2">
                    {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as const).map((status) => {
                      const cfg = STATUS_CONFIG[status];
                      const isActive = current === status;
                      return (
                        <button
                          key={status}
                          onClick={() => toggle(student.id, status)}
                          id={`btn-${student.id}-${status.toLowerCase()}`}
                          title={cfg.fullLabel}
                          className={cn(
                            "w-10 h-10 rounded-xl font-bold text-xs transition-all duration-150 ring-2 ring-transparent",
                            isActive
                              ? cfg.color + " ring-offset-1 scale-105"
                              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
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

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div className="dash-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  {PAST_DATES.map((d) => (
                    <th key={d} className="text-center whitespace-nowrap">
                      {new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </th>
                  ))}
                  <th className="text-center">Rate</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => {
                  const presentCount = s.dates.filter((d) => d === "PRESENT").length;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{getInitials(s.name)}</span>
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap text-sm">{s.name}</span>
                        </div>
                      </td>
                      {s.dates.map((status, di) => {
                        const cfg = STATUS_CONFIG[status!];
                        return (
                          <td key={di} className="text-center">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold",
                                status === "PRESENT" && "bg-green-100 text-green-700",
                                status === "ABSENT" && "bg-red-100 text-red-700",
                                status === "LATE" && "bg-amber-100 text-amber-700",
                                status === "LEAVE" && "bg-blue-100 text-blue-700"
                              )}
                            >
                              {cfg?.label}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center">
                        <span className={cn(
                          "font-bold text-sm",
                          presentCount >= 4 ? "text-green-600" : presentCount >= 3 ? "text-amber-600" : "text-red-500"
                        )}>
                          {Math.round((presentCount / PAST_DATES.length) * 100)}%
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
    </div>
  );
}
