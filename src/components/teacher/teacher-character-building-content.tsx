"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays, CheckCircle2, BookOpen, Loader2, Sparkles,
  Clock, MessageSquare, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StudentAvatar } from "@/components/common/student-avatar";
import {
  CHARACTER_CATEGORIES,
  getCategoryMeta,
  getStatusMeta,
} from "@/lib/character-building";

type Progress = {
  id: string;
  studentId: string;
  status: string;
  notes: string | null;
  taughtAt: string | null;
  completedAt: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  dueDate: string;
  progress: Progress[];
};

type Student = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender: string;
};

type Stats = {
  totalTasks: number;
  pendingStudents: number;
  completedMarks: number;
};

function taskProgress(task: Task, studentCount: number) {
  const completed = task.progress.filter((p) => p.status === "COMPLETED").length;
  const taught = task.progress.filter((p) => p.status === "TAUGHT").length;
  const pct = studentCount ? Math.round(((completed + taught * 0.5) / studentCount) * 100) : 0;
  return { completed, taught, pending: studentCount - completed - taught, pct };
}

export function TeacherCharacterBuildingContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTasks: 0, pendingStudents: 0, completedMarks: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const fetchData = async (keepTaskId?: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/character-tasks");
      if (res.ok) {
        const data = await res.json();
        const nextTasks: Task[] = data.tasks || [];
        setTasks(nextTasks);
        setStudents(data.students || []);
        setStats(data.stats || { totalTasks: 0, pendingStudents: 0, completedMarks: 0 });
        const taskId = keepTaskId || selectedTask?.id;
        const nextSelected = taskId ? nextTasks.find((t) => t.id === taskId) : nextTasks[0];
        if (nextSelected) setSelectedTask(nextSelected);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedProgress = useMemo(() => {
    if (!selectedTask || !selectedStudent) return null;
    return selectedTask.progress.find((p) => p.studentId === selectedStudent.id) || null;
  }, [selectedTask, selectedStudent]);

  const markStatus = async (status: "PENDING" | "TAUGHT" | "COMPLETED", noteOverride?: string) => {
    if (!selectedTask || !selectedStudent) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/character-tasks/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          studentId: selectedStudent.id,
          status,
          notes: noteOverride ?? notes,
        }),
      });
      if (res.ok) {
        setToast(status === "COMPLETED" ? "Marked as completed ✓" : status === "TAUGHT" ? "Marked as taught 📖" : "Reset to pending");
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

  const taskStats = selectedTask ? taskProgress(selectedTask, students.length) : null;
  const cat = selectedTask ? getCategoryMeta(selectedTask.category) : null;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-800 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "My Tasks", value: stats.totalTasks, icon: BookOpen, color: "text-green-700 bg-green-50" },
          { label: "Pending Marks", value: stats.pendingStudents, icon: Clock, color: "text-amber-700 bg-amber-50" },
          { label: "Completed", value: stats.completedMarks, icon: CheckCircle2, color: "text-emerald-700 bg-emerald-50" },
        ].map((s) => (
          <div key={s.label} className="dash-card p-4 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task picker — horizontal cards */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Assigned Tasks</p>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
          {tasks.map((task) => {
            const { pct, completed, taught } = taskProgress(task, students.length);
            const meta = getCategoryMeta(task.category);
            const active = selectedTask?.id === task.id;
            return (
              <button
                key={task.id}
                onClick={() => { setSelectedTask(task); setSelectedStudent(null); setNotes(""); }}
                className={cn(
                  "snap-start flex-shrink-0 w-64 text-left rounded-2xl border p-4 transition-all",
                  active ? "border-green-600 bg-green-50 shadow-md ring-2 ring-green-600/20" : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <span className={cn("pill text-[9px] py-0 mb-2", meta.bg, meta.text)}>
                  {meta.icon} {meta.label}
                </span>
                <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{task.title}</h4>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-[10px] text-gray-500">
                    <CalendarDays className="h-3 w-3 inline mr-1" />
                    {new Date(task.dueDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{pct}%</p>
                    <p className="text-[9px] text-gray-400">{completed} done · {taught} taught</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedTask && cat && taskStats && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Task detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className={cn("dash-card overflow-hidden")}>
              <div className={cn("h-1 bg-gradient-to-r", cat.color)} />
              <div className="p-5">
                <span className={cn("pill text-[10px] py-0 mb-2", cat.bg, cat.text)}>
                  {cat.icon} {cat.label}
                </span>
                <h2 className="font-display text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">
                  {selectedTask.description || "Teach this virtue to your students through discussion and practical examples."}
                </p>
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500">Class progress</span>
                    <span className="font-bold text-green-700">{taskStats.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all" style={{ width: `${taskStats.pct}%` }} />
                  </div>
                  <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
                    <span>✅ {taskStats.completed} completed</span>
                    <span>📖 {taskStats.taught} taught</span>
                    <span>⏳ {taskStats.pending} pending</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedStudent && (
              <div className="dash-card p-5 border-l-4 border-l-green-600">
                <div className="flex items-center gap-3 mb-4">
                  <StudentAvatar name={selectedStudent.fullName} photo={selectedStudent.photo} gender={selectedStudent.gender} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{selectedStudent.fullName}</p>
                    <p className="text-xs text-gray-400">{selectedStudent.studentId}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                      <MessageSquare className="h-3 w-3" /> Teaching Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="What did you teach? How did the student respond?"
                      className="form-input text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markStatus("TAUGHT")}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <BookOpen className="h-4 w-4" /> Mark Taught
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markStatus("COMPLETED")}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Mark Done
                    </button>
                  </div>

                  {selectedProgress && selectedProgress.status !== "PENDING" && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => markStatus("PENDING")}
                      className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
                    >
                      Reset to not started
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => markStatus(selectedProgress?.status as "TAUGHT" | "COMPLETED" || "TAUGHT", notes)}
                    className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Notes</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student grid */}
          <div className="lg:col-span-3 dash-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" /> My Students
              </h3>
              <span className="text-xs text-gray-400">{students.length} students</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {students.map((student) => {
                const prog = selectedTask.progress.find((p) => p.studentId === student.id);
                const status = prog?.status || "PENDING";
                const meta = getStatusMeta(status);
                const isSelected = selectedStudent?.id === student.id;

                return (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student);
                      setNotes(prog?.notes || "");
                    }}
                    className={cn(
                      "text-left p-3 rounded-xl border transition-all hover:shadow-sm",
                      isSelected ? "border-green-500 bg-green-50/50 ring-2 ring-green-500/20" : "border-gray-200 hover:border-gray-300",
                      status === "COMPLETED" && !isSelected && "bg-green-50/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <StudentAvatar name={student.fullName} photo={student.photo} gender={student.gender} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{student.fullName}</p>
                        <span className={cn("pill text-[9px] py-0 mt-1 inline-flex", meta.pill)}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>
                      <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", meta.dot)} />
                    </div>
                    {prog?.notes && (
                      <p className="text-[10px] text-gray-500 mt-2 line-clamp-2 italic pl-11">&ldquo;{prog.notes}&rdquo;</p>
                    )}
                  </button>
                );
              })}
            </div>

            {!selectedStudent && (
              <div className="mt-6 p-6 rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                Select a student to mark teaching progress
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
