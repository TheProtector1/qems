"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isActive: boolean;
};

export function CharacterBuildingContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
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
        setTasks(data);
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
        {tasks.map((task) => (
          <div key={task.id} className={cn(
            "dash-card p-5 border-l-4 transition-all",
            task.isActive ? "border-l-primary-500" : "border-l-gray-300 opacity-60"
          )}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{task.title}</h3>
              <div className="flex gap-1">
                <button onClick={() => openEditModal(task)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => deleteTask(task.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{task.description || "No description provided."}</p>
            
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {new Date(task.dueDate).toLocaleDateString()}
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
          </div>
        ))}
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
    </div>
  );
}
