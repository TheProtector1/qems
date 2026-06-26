"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, CheckCircle2, BookOpen, Loader2, Sparkles,
  Clock, MessageSquare, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHARACTER_CATEGORIES,
  getCategoryMeta,
  getStatusMeta,
} from "@/lib/character-building";

type ClassProgress = {
  id: string;
  classId: string;
  status: string;
  notes: string | null;
  class: { id: string; name: string; programType: string };
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  dueDate: string;
  classProgress: ClassProgress[];
};

type TeacherClass = {
  id: string;
  name: string;
  programType: string;
  studentsCount: number;
};

export function TeacherCharacterBuildingContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async (keepTaskId?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/character-tasks");
      if (!res.ok) return;
      const data = await res.json();
      const nextTasks: Task[] = data.tasks || [];
      setTasks(nextTasks);
      setClasses(data.classes || []);
      const taskId = keepTaskId || selectedTask?.id;
      const nextTask = taskId ? nextTasks.find((t) => t.id === taskId) : nextTasks[0];
      if (nextTask) {
        setSelectedTask(nextTask);
        if (!selectedClass && data.classes?.[0]) setSelectedClass(data.classes[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedProgress = useMemo(() => {
    if (!selectedTask || !selectedClass) return null;
    return selectedTask.classProgress.find((p) => p.classId === selectedClass.id) || null;
  }, [selectedTask, selectedClass]);

  const markStatus = async (status: "PENDING" | "TAUGHT" | "COMPLETED") => {
    if (!selectedTask || !selectedClass) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/character-tasks/class-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          classId: selectedClass.id,
          status,
          notes,
        }),
      });
      if (res.ok) {
        setToast(
          status === "COMPLETED"
            ? `Marked ${selectedClass.name} as completed ✓`
            : status === "TAUGHT"
              ? `Marked ${selectedClass.name} as taught 📖`
              : "Reset to pending"
        );
        setTimeout(() => setToast(null), 2500);
        await fetchData(selectedTask.id);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading your assigned tasks…
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

  if (!classes.length) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h3 className="font-display font-bold text-gray-900 mt-2">No classes assigned</h3>
        <p className="text-sm text-gray-500 mt-2">Contact your institute to assign classes before marking tasks.</p>
      </div>
    );
  }

  const cat = selectedTask ? getCategoryMeta(selectedTask.category) : null;
  const statusMeta = selectedProgress ? getStatusMeta(selectedProgress.status) : null;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-800 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Task list */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Assigned Tasks</h3>
          {tasks.map((task) => {
            const done = task.classProgress.filter((p) => p.status === "COMPLETED").length;
            const meta = getCategoryMeta(task.category);
            return (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTask(task)}
                className={cn(
                  "w-full text-left dash-card p-4 transition-all",
                  selectedTask?.id === task.id && "ring-2 ring-green-600"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className={cn("pill text-[10px] py-0.5", meta.pill)}>{meta.label}</span>
                    <p className="font-semibold text-gray-900 mt-1 text-sm">{task.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-green-700">{done}/{classes.length}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Class marking panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTask && (
            <>
              <div className="dash-card p-5 bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-100">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{cat?.icon}</span>
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900">{selectedTask.title}</h3>
                    {selectedTask.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Mark this task once per class — applies to all students in that class.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Classes</p>
                <div className="flex flex-wrap gap-2">
                  {classes.map((cls) => {
                    const prog = selectedTask.classProgress.find((p) => p.classId === cls.id);
                    const sm = prog ? getStatusMeta(prog.status) : null;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls);
                          setNotes(prog?.notes || "");
                        }}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left transition-all min-w-[140px]",
                          selectedClass?.id === cls.id
                            ? "border-green-600 bg-green-50 ring-2 ring-green-500/20"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <p className="font-semibold text-sm text-gray-900">{cls.name}</p>
                        <p className="text-[10px] text-gray-400">{cls.studentsCount} students · {cls.programType}</p>
                        {sm && (
                          <span className={cn("pill text-[9px] py-0.5 mt-1 inline-block", sm.pill)}>{sm.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedClass && (
                <div className="dash-card p-6">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {selectedClass.name} — mark task status
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    This updates the whole class ({selectedClass.studentsCount} students), not individuals.
                  </p>

                  {statusMeta && (
                    <div className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 mb-4", statusMeta.bg)}>
                      <span className={cn("pill text-[10px]", statusMeta.pill)}>{statusMeta.label}</span>
                    </div>
                  )}

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes for this class (e.g. discussion points, homework)..."
                    rows={3}
                    className="form-input resize-none mb-4"
                  />

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markStatus("TAUGHT")}
                      className="btn-ghost text-sm py-2"
                    >
                      <BookOpen className="h-4 w-4" /> Mark Taught
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markStatus("COMPLETED")}
                      className="btn-primary text-sm py-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markStatus("PENDING")}
                      className="text-xs text-gray-500 hover:text-gray-700 px-3 py-2"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
