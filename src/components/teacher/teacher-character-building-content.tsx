"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, CheckCircle2, BookOpen, Loader2,
  AlertTriangle, Target, Clock, Filter,
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
  classId: string;
  status: string;
  notes: string | null;
  taughtAt?: string | null;
  completedAt?: string | null;
  class: { id: string; name: string; programType: string };
};

type TaskStats = {
  completed: number;
  taught: number;
  pending: number;
  total: number;
  percent: number;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  dueDate: string;
  classProgress?: ClassProgress[];
  stats: TaskStats;
  overdue: boolean;
  rollup: TaskRollupStatus;
};

type TeacherClass = {
  id: string;
  name: string;
  programType: string;
  studentsCount: number;
};

type Summary = {
  totalTasks: number;
  classesCount: number;
  overdueTasks: number;
  completedTasks: number;
  pendingTasks: number;
  classSlotsCompleted: number;
  classSlotsTotal: number;
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

export function TeacherCharacterBuildingContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async (keepTaskId?: string) => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch("/api/teacher/character-tasks");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.error || `Could not load tasks (${res.status})`);
        setTasks([]);
        setClasses([]);
        return;
      }
      const data = await res.json();
      const nextTasks: Task[] = (data.tasks || []).map((t: Task) => ({
        ...t,
        classProgress: t.classProgress || [],
      }));
      const clsList: TeacherClass[] = data.classes || [];
      setTasks(nextTasks);
      setClasses(clsList);
      setSummary(data.summary || null);

      const taskId = keepTaskId || selectedTask?.id;
      const nextTask = taskId ? nextTasks.find((t) => t.id === taskId) : nextTasks[0];
      if (nextTask) {
        setSelectedTask(nextTask);
        const firstPending = clsList.find((cls) => {
          const prog = (nextTask.classProgress || []).find((p) => p.classId === cls.id);
          return !prog || prog.status === "PENDING";
        });
        const pick = firstPending || clsList[0];
        if (pick && (!selectedClass || keepTaskId)) {
          const prog = (nextTask.classProgress || []).find((p) => p.classId === pick.id);
          setSelectedClass(pick);
          setNotes(prog?.notes || "");
        }
      } else {
        setSelectedTask(null);
      }
    } catch {
      setLoadError("Failed to load character building tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilter === "ALL") return true;
      if (taskFilter === "DONE") return t.rollup === "DONE";
      if (taskFilter === "OVERDUE") return t.rollup === "OVERDUE";
      if (taskFilter === "PENDING") return t.rollup === "PENDING" || t.rollup === "IN_PROGRESS";
      return true;
    });
  }, [tasks, taskFilter]);

  const selectedProgress = useMemo(() => {
    if (!selectedTask || !selectedClass) return null;
    return (selectedTask.classProgress || []).find((p) => p.classId === selectedClass.id) || null;
  }, [selectedTask, selectedClass]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const markStatus = async (
    status: "PENDING" | "TAUGHT" | "COMPLETED",
    classIds?: string[]
  ) => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const isBulk = classIds && classIds.length > 1;
      const res = await fetch(
        isBulk
          ? "/api/teacher/character-tasks/class-progress/bulk"
          : "/api/teacher/character-tasks/class-progress",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isBulk
              ? { taskId: selectedTask.id, status, notes, classIds }
              : {
                  taskId: selectedTask.id,
                  classId: classIds?.[0] || selectedClass?.id,
                  status,
                  notes,
                }
          ),
        }
      );
      if (res.ok) {
        const label =
          status === "COMPLETED" ? "Completed" : status === "TAUGHT" ? "Marked taught" : "Reset";
        showToast(isBulk ? `${label} for all classes ✓` : `${label} ✓`);
        await fetchData(selectedTask.id);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Update failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const markClassQuick = async (
    cls: TeacherClass,
    status: "TAUGHT" | "COMPLETED"
  ) => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/character-tasks/class-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          classId: cls.id,
          status,
          notes: selectedClass?.id === cls.id ? notes : undefined,
        }),
      });
      if (res.ok) {
        showToast(`${cls.name}: ${status === "COMPLETED" ? "Completed" : "Taught"} ✓`);
        await fetchData(selectedTask.id);
      }
    } finally {
      setSaving(false);
    }
  };

  const completeAllPending = () => {
    if (!selectedTask) return;
    const pendingIds = classes
      .filter((cls) => {
        const prog = (selectedTask.classProgress || []).find((p) => p.classId === cls.id);
        return !prog || prog.status !== "COMPLETED";
      })
      .map((c) => c.id);
    if (!pendingIds.length) return;
    if (!confirm(`Mark ${pendingIds.length} class(es) as completed for this task?`)) return;
    markStatus("COMPLETED", pendingIds);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading your assigned tasks…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <p className="text-sm text-red-600 font-medium">{loadError}</p>
        <button type="button" onClick={() => fetchData()} className="btn-primary text-sm mt-4">
          Try again
        </button>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <span className="text-5xl">📋</span>
        <h3 className="font-display font-bold text-gray-900 mt-4">No tasks assigned yet</h3>
        <p className="text-sm text-gray-500 mt-2">
          Your institute owner will assign character building tasks to you. Check back soon.
        </p>
      </div>
    );
  }

  const cat = selectedTask ? getCategoryMeta(selectedTask.category) : null;
  const statusMeta = selectedProgress ? getStatusMeta(selectedProgress.status) : null;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-20 sm:top-6 left-4 right-4 sm:left-auto sm:right-6 z-50 bg-green-800 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium text-center sm:text-left">
          {toast}
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Assigned tasks", value: summary.totalTasks, icon: Target, color: "text-blue-700 bg-blue-50" },
            { label: "Overdue", value: summary.overdueTasks, icon: AlertTriangle, color: "text-red-700 bg-red-50" },
            { label: "Fully done", value: summary.completedTasks, icon: CheckCircle2, color: "text-green-700 bg-green-50" },
            {
              label: "Class slots done",
              value: `${summary.classSlotsCompleted}/${summary.classSlotsTotal}`,
              icon: BookOpen,
              color: "text-amber-700 bg-amber-50",
            },
          ].map((k) => (
            <div key={k.label} className="kpi-card p-4">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", k.color)}>
                <k.icon className="h-4 w-4" />
              </div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="font-display text-xl font-bold text-gray-900">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {!classes.length && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Tasks are assigned, but no classes are linked to your account.</p>
          <p className="text-xs mt-1 text-amber-800">
            Ask your institute to assign you to classes under Students → Classes before you can mark progress.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        {(["ALL", "PENDING", "OVERDUE", "DONE"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setTaskFilter(f)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-semibold transition-colors",
              taskFilter === f ? "bg-green-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task list */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
            Assigned Tasks ({filteredTasks.length})
          </h3>
          {filteredTasks.map((task) => {
            const meta = getCategoryMeta(task.category);
            const pri = getPriorityMeta(task.priority);
            const rollup = ROLLUP_LABELS[task.rollup];
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  setSelectedTask(task);
                  const first = classes[0];
                  if (first) {
                    setSelectedClass(first);
                    const prog = (task.classProgress || []).find((p) => p.classId === first.id);
                    setNotes(prog?.notes || "");
                  }
                }}
                className={cn(
                  "w-full text-left dash-card p-4 transition-all",
                  selectedTask?.id === task.id && "ring-2 ring-green-600",
                  task.overdue && "border-red-200"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={cn("pill text-[10px] py-0.5", meta.bg, meta.text)}>{meta.label}</span>
                  <span className={cn("pill text-[9px] py-0.5", rollup.pill)}>{rollup.label}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={cn("pill text-[9px] py-0", pri.pill)}>{pri.label}</span>
                  <span className={cn(
                    "text-[10px] flex items-center gap-0.5",
                    task.overdue ? "text-red-600 font-semibold" : "text-gray-400"
                  )}>
                    <CalendarDays className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>{task.stats.completed}/{task.stats.total} classes done</span>
                    <span>{task.stats.percent}%</span>
                  </div>
                  <ProgressBar percent={task.stats.percent} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTask && classes.length > 0 ? (
            <>
              <div className="dash-card p-5 bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{cat?.icon}</span>
                    <div>
                      <h3 className="font-display text-xl font-bold text-gray-900">{selectedTask.title}</h3>
                      {selectedTask.description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                      )}
                    </div>
                  </div>
                  {selectedTask.stats.pending > 0 && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={completeAllPending}
                      className="btn-primary text-xs py-2 flex-shrink-0"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete all
                    </button>
                  )}
                </div>
              </div>

              {/* Class grid with quick actions */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Your classes — tap to select, quick-mark from card
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {classes.map((cls) => {
                    const prog = (selectedTask.classProgress || []).find((p) => p.classId === cls.id);
                    const sm = prog ? getStatusMeta(prog.status) : getStatusMeta("PENDING");
                    const isSelected = selectedClass?.id === cls.id;
                    return (
                      <div
                        key={cls.id}
                        className={cn(
                          "rounded-xl border p-4 transition-all",
                          isSelected ? "border-green-600 bg-green-50/50 ring-1 ring-green-500/30" : "border-gray-200 bg-white"
                        )}
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => {
                            setSelectedClass(cls);
                            setNotes(prog?.notes || "");
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{cls.name}</p>
                              <p className="text-[10px] text-gray-400">{cls.studentsCount} students · {cls.programType}</p>
                            </div>
                            <span className={cn("pill text-[9px] py-0.5", sm.pill)}>{sm.label}</span>
                          </div>
                          {prog?.completedAt && (
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(prog.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </button>
                        {prog?.status !== "COMPLETED" && (
                          <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => markClassQuick(cls, "TAUGHT")}
                              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                            >
                              Taught
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => markClassQuick(cls, "COMPLETED")}
                              className="flex-1 text-[10px] font-semibold py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedClass && (
                <div className="dash-card p-6">
                  <h4 className="font-semibold text-gray-900">{selectedClass.name} — notes & status</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    Updates apply to all {selectedClass.studentsCount} students in this class.
                  </p>

                  {statusMeta && (
                    <span className={cn("pill text-[10px] mb-4 inline-block", statusMeta.pill)}>
                      {statusMeta.label}
                    </span>
                  )}

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Discussion points, homework, or observations for this class…"
                    rows={3}
                    className="form-input resize-none mb-4"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={saving} onClick={() => markStatus("TAUGHT")} className="btn-ghost text-sm py-2">
                      <BookOpen className="h-4 w-4" /> Mark taught
                    </button>
                    <button type="button" disabled={saving} onClick={() => markStatus("COMPLETED")} className="btn-primary text-sm py-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark completed
                    </button>
                    <button type="button" disabled={saving} onClick={() => markStatus("PENDING")} className="text-xs text-gray-500 px-3 py-2">
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : selectedTask && !classes.length ? (
            <div className="dash-card p-8 text-center text-gray-500 text-sm">
              <p className="font-medium text-gray-800">{selectedTask.title}</p>
              <p className="mt-2">Link classes to your teacher account to start marking this task.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
