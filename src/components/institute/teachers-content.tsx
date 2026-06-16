"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserCheck, Plus, Search, Mail, Phone, BookOpen, Trash2, Edit, Loader2,
  RefreshCw, XCircle, Shield, Award, Calendar, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherRow {
  id: string;
  teacherCode: string;
  name: string;
  email: string;
  qualification: string;
  specialization: string;
  experience: number | null;
  salary: number | null;
  isActive: boolean;
  joinDate: string;
}

// ─── Add/Edit Teacher Modal ───────────────────────────────────
function TeacherModal({
  teacher,
  onClose,
  onSave,
}: {
  teacher?: TeacherRow | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(teacher?.name || "");
  const [email, setEmail] = useState(teacher?.email || "");
  const [password, setPassword] = useState("");
  const [qualification, setQualification] = useState(teacher?.qualification || "");
  const [specialization, setSpecialization] = useState(teacher?.specialization || "Hifz");
  const [experience, setExperience] = useState(teacher?.experience?.toString() || "");
  const [salary, setSalary] = useState(teacher?.salary?.toString() || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!teacher && !password)) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = teacher ? `/api/institute/teachers/${teacher.id}` : "/api/institute/teachers";
      const method = teacher ? "PATCH" : "POST";
      const payload = {
        name,
        email,
        qualification,
        specialization,
        experience,
        salary,
        ...(password && { password }),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save teacher.");
      }

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
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">
              {teacher ? "Edit Teacher details" : "Add New Instructor"}
            </h2>
            <p className="text-primary-200 text-xs mt-0.5">
              {teacher ? `Updating code: ${teacher.teacherCode}` : "Register a new teacher login"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input text-xs"
              placeholder="e.g. Qari Bilal Ahmad"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input text-xs"
              placeholder="e.g. bilal@demo.com"
              required
            />
          </div>

          {!teacher && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input text-xs"
                placeholder="Set login password"
                required={!teacher}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specialty</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Hifz">Hifz</option>
                <option value="Nazra">Nazra</option>
                <option value="Tajweed">Tajweed</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="form-input text-xs"
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Qualification</label>
            <input
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              className="form-input text-xs"
              placeholder="e.g. Shahadat-ul-Almiyah"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Salary (PKR)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="form-input text-xs"
              placeholder="e.g. 30000"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost text-xs py-2 flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs py-2 flex-1 justify-center"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Instructor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Content Component ───────────────────────────────────
export function TeachersContent() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/teachers");
      if (!res.ok) throw new Error("Failed to load instructors.");
      const data = await res.json();
      const rows: TeacherRow[] = (data.teachers || []).map((t: any) => ({
        id: t.id,
        teacherCode: t.teacherCode,
        name: t.user?.name || "Unknown",
        email: t.user?.email || "—",
        qualification: t.qualification || "—",
        specialization: t.specialization || "Hifz",
        experience: t.experience,
        salary: t.salary ? parseFloat(t.salary) : null,
        isActive: t.isActive,
        joinDate: t.joinDate
          ? new Date(t.joinDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
      }));
      setTeachers(rows);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this instructor? This will also delete their login account.")) {
      return;
    }
    try {
      const res = await fetch(`/api/institute/teachers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete teacher.");
      }
      fetchTeachers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const filtered = teachers.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.teacherCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {(isAdding || editingTeacher) && (
        <TeacherModal
          teacher={editingTeacher}
          onClose={() => {
            setIsAdding(false);
            setEditingTeacher(null);
          }}
          onSave={fetchTeachers}
        />
      )}

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary-700" /> Teaching Faculty
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage details and course assignments for instructors</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs py-2" onClick={fetchTeachers} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            <button className="btn-primary text-xs py-2" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4" /> Add Teacher
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="dash-card p-4 bg-white flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search teacher by name, email, or code..."
              className="form-input pl-10 h-10 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Roster */}
        <div className="dash-card overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="text-sm">Loading teaching staff...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
              <p className="text-sm font-semibold">Failed to load roster</p>
              <p className="text-xs text-gray-400">{error}</p>
              <button onClick={fetchTeachers} className="btn-ghost text-xs mt-2">Try Again</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher Name</th>
                  <th>Specialty</th>
                  <th>Qualification</th>
                  <th>Experience</th>
                  <th>Salary</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      {teachers.length === 0 ? "No teachers found. Register one above!" : "No teachers match your search."}
                    </td>
                  </tr>
                )}
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs">
                          {t.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{t.teacherCode} · {t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="pill pill-primary text-[10px] py-0.5">{t.specialization}</span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 font-medium">{t.qualification}</span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500">{t.experience ? `${t.experience} Yrs` : "—"}</span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 font-bold">{t.salary ? `PKR ${t.salary.toLocaleString()}` : "—"}</span>
                    </td>
                    <td className="text-gray-400 text-xs">{t.joinDate}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTeacher(t)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent transition-colors"
                          title="Edit Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent transition-colors"
                          title="Delete Instructor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
