"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen, CalendarDays, CheckCircle2, Loader2, AlertTriangle, Target, Clock, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCategoryMeta,
  getPriorityMeta,
  getStatusMeta,
} from "@/lib/character-building";
import { ROLLUP_LABELS, type TaskRollupStatus } from "@/lib/character-task-stats";

type ClassProgress = {
  id: string;
  status: string;
  notes: string | null;
  taughtAt: string | null;
  completedAt: string | null;
  class: { id: string; name: string; programType: string };
  teacherName: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  dueDate: string;
  overdue: boolean;
  rollup: TaskRollupStatus;
  stats: { completed: number; taught: number; pending: number; total: number; percent: number };
  classProgress: ClassProgress[];
};

type ChildOption = {
  id: string;
  fullName: string;
  studentId: string;
  classes: { id: string; name: string; programType: string }[];
};

type Summary = {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
};

type TaskFilter = "ALL" | "PENDING" | "OVERDUE" | "DONE";

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("h-1.5 rounded-full bg-gray-100 overflow-hidden", className)}>
      <div
        className="h-full rounded-full bg-green-600 transition-all duration-500"
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function ParentCharacterBuildingContent() {
  const [students, setStudents] = useState<ChildOption[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const fetchData = async (studentId?: string | null) => {
    try {
      setLoading(true);
      setLoadError(null);
      const qs = studentId ? `?studentId=${studentId}` : "";
      const res = await fetch(`/api/parent/character-building${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || `Could not load character tasks (${res.status})`);
        setTasks([]);
        return;
      }
      const data = await res.json();
      setStudents(data.students || []);
      setTasks(data.tasks || []);
      setSummary(data.summary || null);
      if (!studentId && data.students?.length === 1) {
        setSelectedStudentId(data.students[0].id);
      }
    } catch {
      setLoadError("Network error loading character building tasks.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedStudentId);
  }, [selectedStudentId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "ALL") return true;
      if (taskFilter === "DONE") return t.rollup === "DONE";
      if (taskFilter === "OVERDUE") return t.overdue;
      return t.rollup === "PENDING" || t.rollup === "IN_PROGRESS";
    });
  }, [tasks, taskFilter]);

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading character building tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary-700" /> Character Building
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Read-only view of your child&apos;s class character tasks
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Active Tasks", value: summary.totalTasks, icon: Target, color: "text-primary-700 bg-primary-50" },
            { label: "Completed", value: summary.completedTasks, icon: CheckCircle2, color: "text-green-700 bg-green-50" },
            { label: "In Progress", value: summary.inProgressTasks, icon: Clock, color: "text-blue-700 bg-blue-50" },
            { label: "Overdue", value: summary.overdueTasks, icon: AlertTriangle, color: "text-amber-700 bg-amber-50" },
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

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {(["ALL", "PENDING", "OVERDUE", "DONE"] as TaskFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setTaskFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
              taskFilter === f ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {f === "ALL" ? "All" : f === "PENDING" ? "Active" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="dash-card p-12 text-center">
          <span className="text-4xl block mb-3">🌱</span>
          <h3 className="font-semibold text-gray-900 mb-1">No character tasks yet</h3>
          <p className="text-sm text-gray-500">
            When teachers mark character building activities for your child&apos;s class, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const cat = getCategoryMeta(task.category);
            const priority = getPriorityMeta(task.priority);
            const rollup = ROLLUP_LABELS[task.rollup];
            const expanded = expandedTaskId === task.id;

            return (
              <div key={task.id} className="dash-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                  className="w-full text-left p-5 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0", cat.bg)}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <span className={cn("pill text-[10px] py-0.5", priority.pill)}>{priority.label}</span>
                        <span className={cn("pill text-[10px] py-0.5", rollup.pill)}>{rollup.label}</span>
                        {task.overdue && (
                          <span className="pill pill-danger text-[10px] py-0.5">Overdue</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Due {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span>{cat.label}</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Class progress</span>
                          <span>{task.stats.percent}%</span>
                        </div>
                        <ProgressBar percent={task.stats.percent} />
                      </div>
                    </div>
                  </div>
                </button>

                {expanded && task.classProgress.length > 0 && (
                  <div className="border-t border-border px-5 py-4 bg-gray-50/40 space-y-3">
                    {task.classProgress.map((cp) => {
                      const status = getStatusMeta(cp.status);
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
                            <p className="text-xs text-gray-500 mb-1">Teacher: {cp.teacherName}</p>
                          )}
                          {cp.taughtAt && (
                            <p className="text-xs text-gray-400">
                              Taught: {new Date(cp.taughtAt).toLocaleDateString("en-PK")}
                            </p>
                          )}
                          {cp.completedAt && (
                            <p className="text-xs text-gray-400">
                              Completed: {new Date(cp.completedAt).toLocaleDateString("en-PK")}
                            </p>
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
