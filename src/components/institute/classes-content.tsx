"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, Loader2, RefreshCw, Users, BookOpen,
  Trash2, Edit, XCircle, AlertTriangle, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProgramType = "HIFZ" | "NAZRA" | "TAJWEED";

interface ClassRow {
  id: string;
  name: string;
  code: string | null;
  programType: ProgramType;
  capacity: number;
  isActive: boolean;
  teacherName: string | null;
  enrolledCount: number;
}

const PROGRAM_COLORS: Record<ProgramType, string> = {
  HIFZ: "pill-success",
  NAZRA: "pill-info",
  TAJWEED: "pill-warning",
};

interface Teacher { id: string; name: string; }

function ClassModal({
  cls,
  teachers,
  onClose,
  onSave,
}: {
  cls?: ClassRow | null;
  teachers: Teacher[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(cls?.name || "");
  const [programType, setProgramType] = useState<ProgramType>(cls?.programType || "HIFZ");
  const [capacity, setCapacity] = useState(cls?.capacity?.toString() || "30");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { setError("Class name is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const url = cls ? `/api/institute/classes/${cls.id}` : "/api/institute/classes";
      const method = cls ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, programType, capacity, teacherId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save.");
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">{cls ? "Edit Class" : "Create New Class"}</h2>
            <p className="text-primary-200 text-xs mt-0.5">{cls ? `Editing: ${cls.code}` : "Add a new class section"}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><XCircle className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Class Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} className="form-input text-xs" placeholder="e.g. Hifz A, Nazra Morning" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Program</label>
              <select value={programType} onChange={e => setProgramType(e.target.value as ProgramType)} className="form-input text-xs">
                <option value="HIFZ">Hifz</option>
                <option value="NAZRA">Nazra</option>
                <option value="TAJWEED">Tajweed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Capacity</label>
              <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} className="form-input text-xs" placeholder="30" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Teacher (Optional)</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="form-input text-xs">
              <option value="">— No teacher assigned —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs py-2 flex-1" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary text-xs py-2 flex-1 justify-center" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : cls ? "Save Changes" : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClassesContent() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [deleting, setDeleting] = useState<ClassRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [classRes, teacherRes] = await Promise.all([
        fetch("/api/institute/classes"),
        fetch("/api/institute/teachers"),
      ]);
      if (!classRes.ok) throw new Error("Failed to load classes.");
      const classData = await classRes.json();
      setClasses((classData.classes || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        programType: c.programType,
        capacity: c.capacity,
        isActive: c.isActive,
        teacherName: c.teacher?.user?.name || null,
        enrolledCount: c._count?.enrollments || 0,
      })));

      if (teacherRes.ok) {
        const tData = await teacherRes.json();
        setTeachers((tData.teachers || []).map((t: any) => ({ id: t.id, name: t.user?.name || "Unknown" })));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/institute/classes/${deleting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete.");
      setDeleting(null);
      fetchData();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const grouped = classes.reduce<Record<ProgramType, ClassRow[]>>((acc, c) => {
    if (!acc[c.programType]) acc[c.programType] = [];
    acc[c.programType].push(c);
    return acc;
  }, {} as any);

  return (
    <>
      {(isAdding || editing) && (
        <ClassModal
          cls={editing}
          teachers={teachers}
          onClose={() => { setIsAdding(false); setEditing(null); }}
          onSave={fetchData}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h3 className="font-display font-bold text-gray-900 mb-1">Delete Class</h3>
            <p className="text-sm text-gray-500 mb-2">
              Delete <strong>{deleting.name}</strong>? This will also remove all enrollments and attendance records for this class.
            </p>
            {deleteError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-3">{deleteError}</p>}
            <div className="flex gap-3 mt-4">
              <button className="btn-ghost flex-1 py-2" onClick={() => { setDeleting(null); setDeleteError(null); }} disabled={deleteLoading}>Cancel</button>
              <button
                className="flex-1 py-2 bg-red-500 text-white hover:bg-red-600 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="section-heading">Class Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {classes.length} class{classes.length !== 1 ? "es" : ""} across all programs
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-sm py-2" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            <button className="btn-primary text-sm py-2" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" /> New Class
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-400">
            <Loader2 className="h-7 w-7 animate-spin mr-3" /> Loading classes...
          </div>
        ) : error ? (
          <div className="dash-card p-10 text-center text-red-500">
            <p className="font-semibold">{error}</p>
            <button onClick={fetchData} className="btn-ghost text-xs mt-3">Try Again</button>
          </div>
        ) : classes.length === 0 ? (
          <div className="dash-card p-16 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">No classes yet</h3>
            <p className="text-sm text-gray-500">Create your first class section to get started.</p>
            <button className="btn-primary mt-5 text-sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" /> Create Class
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([program, cls]) => (
            <div key={program}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> {program === "HIFZ" ? "Hifz" : program === "NAZRA" ? "Nazra" : "Tajweed"} Classes
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cls.map(c => (
                  <div key={c.id} className="dash-card p-5 group hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg font-bold text-gray-900">{c.name}</h3>
                        {c.code && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{c.code}</p>}
                        <span className={cn("pill text-[10px] py-0.5 mt-1.5 inline-block", PROGRAM_COLORS[c.programType])}>
                          {c.programType}
                        </span>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 mt-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                        <span>Teacher: <strong>{c.teacherName || "—"}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span>{c.enrolledCount} / {c.capacity} enrolled</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${Math.min((c.enrolledCount / c.capacity) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn-ghost flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                        onClick={() => setEditing(c)}
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        className="flex-1 text-xs py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
                        onClick={() => { setDeleteError(null); setDeleting(c); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
