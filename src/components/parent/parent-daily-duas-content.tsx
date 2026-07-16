"use client";

import { useState, useEffect, useMemo } from "react";
import { BookOpen, CheckCircle2, Loader2, Moon, Eye, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDuaCategoryMeta,
  getDuaPriorityMeta,
  getDuaStatusMeta,
  DUA_ROLLUP_LABELS,
  type DuaRollupStatus,
} from "@/lib/daily-dua";

type ClassProgress = {
  id: string;
  status: string;
  notes: string | null;
  taughtAt: string | null;
  completedAt: string | null;
  class: { id: string; name: string; programType: string };
  teacherName: string | null;
};

type Dua = {
  id: string;
  title: string;
  arabicText: string;
  urduTranslation: string;
  transliteration: string | null;
  reference: string | null;
  notes: string | null;
  category: string;
  priority: string;
  rollup: DuaRollupStatus;
  stats: { completed: number; taught: number; pending: number; total: number; percent: number };
  classProgress: ClassProgress[];
};

type ChildOption = {
  id: string;
  fullName: string;
  studentId: string;
};

type Summary = {
  totalDuas: number;
  completedDuas: number;
  inProgressDuas: number;
};

type DuaFilter = "ALL" | "PENDING" | "DONE";

export function ParentDailyDuasContent() {
  const [students, setStudents] = useState<ChildOption[]>([]);
  const [duas, setDuas] = useState<Dua[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [duaFilter, setDuaFilter] = useState<DuaFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async (studentId?: string | null) => {
    try {
      setLoading(true);
      setLoadError(null);
      const qs = studentId ? `?studentId=${studentId}` : "";
      const res = await fetch(`/api/parent/daily-duas${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || `Could not load daily duas (${res.status})`);
        setDuas([]);
        return;
      }
      const data = await res.json();
      setStudents(data.students || []);
      setDuas(data.duas || []);
      setSummary(data.summary || null);
      if (!studentId && data.students?.length === 1) {
        setSelectedStudentId(data.students[0].id);
      }
    } catch {
      setLoadError("Network error loading daily duas.");
      setDuas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedStudentId);
  }, [selectedStudentId]);

  const filtered = useMemo(() => {
    return duas.filter((d) => {
      if (duaFilter === "ALL") return true;
      if (duaFilter === "DONE") return d.rollup === "DONE";
      return d.rollup === "PENDING" || d.rollup === "IN_PROGRESS";
    });
  }, [duas, duaFilter]);

  if (loading && duas.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading daily duas...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Moon className="h-6 w-6 text-indigo-700" /> Daily Duas
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Duas your child&apos;s class is learning at school
          </p>
        </div>
        {students.length > 1 && (
          <select
            value={selectedStudentId || ""}
            onChange={(e) => setSelectedStudentId(e.target.value || null)}
            className="form-input w-full sm:w-56 h-9 py-1 text-sm"
          >
            <option value="">All children</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Active Duas", value: summary.totalDuas, icon: BookOpen, color: "text-indigo-700 bg-indigo-50" },
            { label: "Completed", value: summary.completedDuas, icon: CheckCircle2, color: "text-green-700 bg-green-50" },
            { label: "In Progress", value: summary.inProgressDuas, icon: Clock, color: "text-blue-700 bg-blue-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="dash-card p-4">
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-2", s.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display text-xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["ALL", "PENDING", "DONE"] as DuaFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setDuaFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              duaFilter === f ? "bg-white text-indigo-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {f === "ALL" ? "All" : f === "PENDING" ? "Active" : "Done"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="dash-card p-12 text-center">
          <span className="text-4xl block mb-3">🤲</span>
          <h3 className="font-semibold text-gray-900 mb-1">No daily duas yet</h3>
          <p className="text-sm text-gray-500">
            When teachers teach daily duas in your child&apos;s class, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((dua) => {
            const cat = getDuaCategoryMeta(dua.category);
            const priority = getDuaPriorityMeta(dua.priority);
            const rollup = DUA_ROLLUP_LABELS[dua.rollup];
            const expanded = expandedId === dua.id;

            return (
              <div key={dua.id} className="dash-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : dua.id)}
                  className="w-full text-left p-5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0", cat.bg)}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{dua.title}</h3>
                        <span className={cn("pill text-[10px] py-0.5", priority.pill)}>{priority.label}</span>
                        <span className={cn("pill text-[10px] py-0.5", rollup.pill)}>{rollup.label}</span>
                      </div>
                      <p className="font-arabic text-xl leading-relaxed text-gray-900" dir="rtl">
                        {dua.arabicText}
                      </p>
                      <p className="font-urdu text-base text-gray-700 mt-2" dir="rtl">
                        {dua.urduTranslation}
                      </p>
                      {dua.transliteration && (
                        <p className="text-sm text-gray-500 italic mt-1">{dua.transliteration}</p>
                      )}
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border px-5 py-4 bg-gray-50/40 space-y-3">
                    {dua.reference && (
                      <p className="text-xs text-gray-500">Reference: {dua.reference}</p>
                    )}
                    {dua.classProgress.map((cp) => {
                      const status = getDuaStatusMeta(cp.status);
                      return (
                        <div key={cp.id} className="rounded-xl border border-border bg-white p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{cp.class.name}</p>
                              <p className="text-xs text-gray-400">{cp.class.programType}</p>
                            </div>
                            <span className={cn("pill text-[10px] py-0.5", status.pill)}>
                              {status.icon} {status.label}
                            </span>
                          </div>
                          {cp.teacherName && (
                            <p className="text-xs text-gray-500">Teacher: {cp.teacherName}</p>
                          )}
                          {cp.notes && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                              {cp.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
