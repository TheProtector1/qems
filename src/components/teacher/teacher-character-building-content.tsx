"use client";

import { useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Progress = {
  id: string;
  studentId: string;
  status: string;
  notes: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  progress: Progress[];
};

type Student = {
  id: string;
  fullName: string;
  studentId: string;
};

export function TeacherCharacterBuildingContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected state for tracking progress
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [progressStatus, setProgressStatus] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/character-tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
        setStudents(data.students);
        if (data.tasks.length > 0 && !selectedTask) {
          setSelectedTask(data.tasks[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedStudent) return;
    
    try {
      const res = await fetch("/api/teacher/character-tasks/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          studentId: selectedStudent.id,
          status: progressStatus,
          notes,
        }),
      });

      if (res.ok) {
        // Optimistically update UI or re-fetch
        fetchData();
        setSelectedStudent(null);
        setNotes("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading active tasks...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Task List Sidebar */}
        <div className="dash-card p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4">Active Tasks</h3>
          <div className="space-y-3">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-200",
                  selectedTask?.id === task.id
                    ? "border-primary-500 bg-primary-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </button>
            ))}
            {tasks.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No active character building tasks.</p>
            )}
          </div>
        </div>

        {/* Task Details and Student Assignment */}
        {selectedTask && (
          <div className="lg:col-span-2 space-y-6">
            <div className="dash-card p-6 border-l-4 border-l-primary-500">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedTask.description || "No description provided."}</p>
              <div className="flex gap-4 mt-4 text-sm font-medium">
                <span className="text-red-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Deadline: {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Mark Student Progress</h3>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                    {students.map(student => {
                      const prog = selectedTask.progress.find(p => p.studentId === student.id);
                      const isCompleted = prog?.status === "COMPLETED";
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            setSelectedStudent(student);
                            setProgressStatus(prog?.status as any || "PENDING");
                            setNotes(prog?.notes || "");
                          }}
                          className={cn(
                            "w-full text-left flex justify-between items-center p-3 rounded-lg border text-sm transition-colors",
                            selectedStudent?.id === student.id ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50",
                            isCompleted && selectedStudent?.id !== student.id && "bg-green-50/30 opacity-75"
                          )}
                        >
                          <span className="font-medium">{student.fullName}</span>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedStudent ? (
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">👤</span> {selectedStudent.fullName}
                    </h4>
                    <form onSubmit={saveProgress} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setProgressStatus("COMPLETED")}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                              progressStatus === "COMPLETED" ? "bg-green-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
                            )}
                          >
                            Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => setProgressStatus("PENDING")}
                            className={cn(
                              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                              progressStatus === "PENDING" ? "bg-amber-500 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
                            )}
                          >
                            Pending
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Teacher Notes (Optional)</label>
                        <textarea
                          rows={3}
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="e.g. Needs more focus, performed excellently..."
                          className="form-input w-full text-sm"
                        />
                      </div>
                      
                      <button type="submit" className="btn-primary w-full">
                        Save Progress
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                    <span className="text-4xl mb-3">👈</span>
                    <p className="text-sm">Select a student from the list to update their task progress.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
