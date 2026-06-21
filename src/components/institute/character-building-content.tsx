"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, Clock, CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Progress = {
  id: string;
  studentId: string;
  status: string; // PENDING, COMPLETED
  notes: string | null;
  completedAt: string | null;
  student: {
    id: string;
    fullName: string;
    studentId: string;
  };
  teacher?: {
    user: {
      name: string;
    };
  } | null;
};

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isActive: boolean;
  progress: Progress[];
};

type Student = {
  id: string;
  fullName: string;
  studentId: string;
};

export function CharacterBuildingContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingProgressTask, setViewingProgressTask] = useState<Task | null>(null);
  const [progressSearch, setProgressSearch] = useState("");
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/institute/character-tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openNewModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setDueDate("");
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    setIsModalOpen(true);
  };

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTask) {
        const res = await fetch(`/api/institute/character-tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, dueDate }),
        });
        if (res.ok) {
          fetchTasks();
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch("/api/institute/character-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, dueDate }),
        });
        if (res.ok) {
          fetchTasks();
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleStatus = async (task: Task) => {
    try {
      await fetch(`/api/institute/character-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !task.isActive }),
      });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await fetch(`/api/institute/character-tasks/${id}`, {
        method: "DELETE",
      });
      fetchTasks();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Character Building Tasks</h2>
          <p className="text-sm text-gray-500 mt-1">
            Assign character development tasks to all students. Teachers will report progress.
          </p>
        </div>
        <button onClick={openNewModal} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Task
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => {
          const completedCount = task.progress?.filter(p => p.status === "COMPLETED").length || 0;
          const progressPercent = students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;
          
          return (
            <div key={task.id} className={cn(
              "dash-card p-5 border-l-4 transition-all flex flex-col justify-between",
              task.isActive ? "border-l-primary-500" : "border-l-gray-300 opacity-60"
            )}>
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(task)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md" title="Edit Task">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md" title="Delete Task">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description || "No description provided."}</p>
              </div>
              
              <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => toggleStatus(task)}
                    className={cn(
                      "pill text-[10px] cursor-pointer",
                      task.isActive ? "pill-success" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {task.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
                
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-gray-700">{completedCount}</span> / {students.length} Completed ({progressPercent}%)
                  </div>
                  <button
                    onClick={() => setViewingProgressTask(task)}
                    className="text-xs font-semibold text-primary-700 hover:text-primary-800 flex items-center gap-0.5"
                  >
                    View Progress &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="col-span-full py-12 text-center dash-card">
            <span className="text-4xl">🌟</span>
            <h3 className="mt-4 font-semibold text-gray-900">No tasks created yet</h3>
            <p className="text-sm text-gray-500 mt-1">Create your first character building task to track student progress.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h3>
            <form onSubmit={saveTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input w-full"
                  placeholder="e.g., Maintain wudu for 5 prayers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-input w-full"
                  placeholder="Additional details or instructions..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="form-input w-full"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Detail Modal */}
      {viewingProgressTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Task Progress Details</h3>
                <p className="text-xs font-semibold text-primary-700 mt-1">{viewingProgressTask.title}</p>
                {viewingProgressTask.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{viewingProgressTask.description}</p>
                )}
              </div>
              <button
                onClick={() => { setViewingProgressTask(null); setProgressSearch(""); }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">Completed</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {viewingProgressTask.progress?.filter(p => p.status === "COMPLETED").length || 0}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {students.length - (viewingProgressTask.progress?.filter(p => p.status === "COMPLETED").length || 0)}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total Students</p>
                <p className="text-2xl font-bold text-gray-700 mt-1">{students.length}</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search students..."
                value={progressSearch}
                onChange={e => setProgressSearch(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
              {students
                .filter(student => student.fullName.toLowerCase().includes(progressSearch.toLowerCase()))
                .map(student => {
                  const prog = viewingProgressTask.progress?.find(p => p.studentId === student.id);
                  const isCompleted = prog?.status === "COMPLETED";
                  
                  return (
                    <div
                      key={student.id}
                      className={cn(
                        "p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors",
                        isCompleted ? "border-green-200 bg-green-50/10" : "border-gray-200 bg-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0",
                          isCompleted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {student.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{student.fullName}</p>
                          <p className="text-[10px] text-gray-400">{student.studentId}</p>
                        </div>
                      </div>

                      <div className="flex-1 max-w-md md:px-4">
                        {isCompleted ? (
                          <div className="space-y-0.5">
                            <span className="pill pill-success text-[9px] py-0">Completed</span>
                            {prog.notes && (
                              <p className="text-gray-600 leading-snug italic mt-1 font-medium bg-white/50 border border-gray-100 rounded p-1.5">
                                &ldquo;{prog.notes}&rdquo;
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              Marked by {prog.teacher?.user?.name || "Teacher"} on {prog.completedAt ? new Date(prog.completedAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                            </p>
                          </div>
                        ) : (
                          <span className="pill bg-gray-100 text-gray-500 text-[9px] py-0">Pending / In Progress</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {students.filter(student => student.fullName.toLowerCase().includes(progressSearch.toLowerCase())).length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">No students match your search.</p>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => { setViewingProgressTask(null); setProgressSearch(""); }}
                className="btn-ghost"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
