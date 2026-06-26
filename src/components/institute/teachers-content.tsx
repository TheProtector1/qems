"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  UserCheck, Plus, Search, Trash2, Edit, Loader2, RefreshCw,
  XCircle, DollarSign, ChevronDown, Users, Briefcase, AlertTriangle,
  Check, X, Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImageFile } from "@/lib/image";

// ─── Types ────────────────────────────────────────────────────
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
  image: string | null;
}

interface StaffRow {
  id: string;
  name: string;
  email: string;
  staffRole: string | null;
  phone: string | null;
  salary: number | null;
  isActive: boolean;
  createdAt: string;
  image: string | null;
}

// ─── Confirm Delete Modal ─────────────────────────────────────
function DeleteModal({
  name,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="font-display font-bold text-gray-900 mb-1">Confirm Deletion</h3>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to remove <strong>{name}</strong>? This will also delete their login account and cannot be undone.
        </p>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-4">{error}</p>}
        <div className="flex gap-3">
          <button type="button" className="btn-ghost flex-1 py-2" onClick={onCancel} disabled={loading}>Cancel</button>
          <button
            type="button"
            className="flex-1 py-2 bg-red-500 text-white hover:bg-red-600 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> Delete</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher/Staff Form Modal ─────────────────────────────────
function PersonModal({
  type,
  person,
  onClose,
  onSave,
}: {
  type: "teacher" | "staff";
  person?: TeacherRow | StaffRow | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isTeacher = type === "teacher";
  const [name, setName] = useState((person as any)?.name || "");
  const [email, setEmail] = useState((person as any)?.email || "");
  const [password, setPassword] = useState("");
  const [qualification, setQualification] = useState((person as TeacherRow)?.qualification || "");
  const [specialization, setSpecialization] = useState((person as TeacherRow)?.specialization || "Hifz");
  const [experience, setExperience] = useState((person as TeacherRow)?.experience?.toString() || "");
  const [salary, setSalary] = useState((person as any)?.salary?.toString() || "");
  const [staffRole, setStaffRole] = useState((person as StaffRow)?.staffRole || "");
  const [phone, setPhone] = useState((person as StaffRow)?.phone || "");
  const [image, setImage] = useState((person as any)?.image || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const compressed = await compressImageFile(file);
      setImage(compressed);
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!person && !password)) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isEdit = !!person;
      const url = isTeacher
        ? (isEdit ? `/api/institute/teachers/${(person as TeacherRow).id}` : "/api/institute/teachers")
        : (isEdit ? `/api/institute/staff/${(person as StaffRow).id}` : "/api/institute/staff");
      const method = isEdit ? "PATCH" : "POST";
      const payload = isTeacher
        ? { name, email, qualification, specialization, experience, salary, image, ...(password && { password }) }
        : { name, email, staffRole, phone, salary, image, ...(password && { password }) };

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save.");
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
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">
              {person ? "Edit" : "Add"} {isTeacher ? "Teacher" : "Staff Member"}
            </h2>
            <p className="text-primary-200 text-xs mt-0.5">
              {person ? "Update details" : isTeacher ? "Register a new teacher login" : "Add non-teaching staff"}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">{error}</div>}

          {/* Profile Image Uploader */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl mb-2">
            <div className="relative flex-shrink-0">
              {image ? (
                <img src={image} alt="Preview" className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-500" />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                  {name ? name.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : "?"}
                </div>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              <span className="block text-xs font-semibold text-gray-700">Profile Photo</span>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => handleImageChange(e.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-[10px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" /> Upload File
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-100 flex items-center gap-1 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Or paste image URL..."
                value={image}
                onChange={e => setImage(e.target.value)}
                className="form-input text-[10px] h-7 px-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} className="form-input text-xs" placeholder="e.g. Qari Bilal Ahmad" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input text-xs" placeholder="e.g. bilal@demo.com" required />
          </div>
          {!person && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input text-xs" placeholder="Set login password" required />
            </div>
          )}

          {isTeacher ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Specialty</label>
                  <select value={specialization} onChange={e => setSpecialization(e.target.value)} className="form-input text-xs">
                    {["Hifz", "Nazra", "Tajweed", "Arabic"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
                  <input type="number" value={experience} onChange={e => setExperience(e.target.value)} className="form-input text-xs" placeholder="e.g. 5" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Qualification</label>
                <input value={qualification} onChange={e => setQualification(e.target.value)} className="form-input text-xs" placeholder="e.g. Shahadat-ul-Almiyah" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Title</label>
                  <input value={staffRole} onChange={e => setStaffRole(e.target.value)} className="form-input text-xs" placeholder="e.g. Accountant" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} className="form-input text-xs" placeholder="e.g. 0300-1234567" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Salary (PKR)</label>
            <input type="number" value={salary} onChange={e => setSalary(e.target.value)} className="form-input text-xs" placeholder="e.g. 30000" />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-xs py-2 flex-1" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary text-xs py-2 flex-1 justify-center" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Salary Manager Modal ─────────────────────────────────────
function SalaryModal({
  teachers,
  onClose,
  onSave,
}: {
  teachers: TeacherRow[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [salaries, setSalaries] = useState<Record<string, string>>(
    Object.fromEntries(teachers.map(t => [t.id, t.salary?.toString() || ""]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateSalary = async (teacher: TeacherRow) => {
    setSaving(true);
    setErrors(prev => { const n = {...prev}; delete n[teacher.id]; return n; });
    try {
      const res = await fetch(`/api/institute/teachers/${teacher.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: salaries[teacher.id] }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setSaved(prev => ({ ...prev, [teacher.id]: true }));
      setTimeout(() => setSaved(prev => { const n = {...prev}; delete n[teacher.id]; return n; }), 2000);
      onSave();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, [teacher.id]: err.message }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Salary Management</h2>
            <p className="text-emerald-200 text-xs mt-0.5">Update monthly salaries for teaching staff</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"><XCircle className="h-5 w-5" /></button>
        </div>
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
          {teachers.map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              {t.image ? (
                <img src={t.image} alt={t.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-200" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                <p className="text-[10px] text-gray-400">{t.specialization}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">PKR</span>
                  <input
                    type="number"
                    className="form-input text-xs pl-10 w-32"
                    value={salaries[t.id]}
                    onChange={e => setSalaries(prev => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <button
                  onClick={() => updateSalary(t)}
                  disabled={saving}
                  className={cn(
                    "p-2 rounded-lg text-xs font-medium transition-colors",
                    saved[t.id] ? "bg-green-100 text-green-700" : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                  )}
                >
                  {saved[t.id] ? <Check className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </button>
              </div>
              {errors[t.id] && <p className="text-xs text-red-500 mt-1 w-full">{errors[t.id]}</p>}
            </div>
          ))}
          {teachers.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">No teachers to manage salaries for.</p>
          )}
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="btn-ghost w-full py-2">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function TeachersContent() {
  const [activeTab, setActiveTab] = useState<"teachers" | "staff">("teachers");
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffRow | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<{ id: string; name: string; type: "teacher" | "staff" } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showSalary, setShowSalary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teacherRes, staffRes] = await Promise.all([
        fetch("/api/institute/teachers"),
        fetch("/api/institute/staff"),
      ]);
      if (!teacherRes.ok) throw new Error("Failed to load teachers.");
      const teacherData = await teacherRes.json();
      const rows: TeacherRow[] = (teacherData.teachers || []).map((t: any) => ({
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
        image: t.user?.image || null,
      }));
      setTeachers(rows);

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        const staffRows: StaffRow[] = (staffData.staff || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          staffRole: s.staffRole,
          phone: s.phone,
          salary: s.salary ? parseFloat(s.salary) : null,
          isActive: s.isActive,
          createdAt: new Date(s.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
          image: s.image || null,
        }));
        setStaff(staffRows);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const url = deletingId.type === "teacher"
        ? `/api/institute/teachers/${deletingId.id}`
        : `/api/institute/staff/${deletingId.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete.");
      setDeletingId(null);
      fetchData();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.teacherCode.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStaff = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.staffRole || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {deletingId && (
        <DeleteModal
          name={deletingId.name}
          onConfirm={handleDelete}
          onCancel={() => { setDeletingId(null); setDeleteError(null); }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}
      {((activeTab === "teachers" && isAdding) || editingTeacher) && (
        <PersonModal
          type="teacher"
          person={editingTeacher}
          onClose={() => { setIsAdding(false); setEditingTeacher(null); }}
          onSave={fetchData}
        />
      )}
      {((activeTab === "staff" && isAdding) || editingStaff) && (
        <PersonModal
          type="staff"
          person={editingStaff}
          onClose={() => { setIsAdding(false); setEditingStaff(null); }}
          onSave={fetchData}
        />
      )}
      {showSalary && (
        <SalaryModal
          teachers={teachers}
          onClose={() => setShowSalary(false)}
          onSave={fetchData}
        />
      )}

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <h2 className="section-heading font-display font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary-700 shrink-0" /> Staff Management
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage teachers and other institute staff</p>
          </div>
          <div className="page-header-actions">
            <button className="btn-ghost text-xs py-2" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            {activeTab === "teachers" && (
              <button className="btn-ghost text-xs py-2 text-emerald-700 border border-emerald-200 hover:bg-emerald-50" onClick={() => setShowSalary(true)}>
                <DollarSign className="h-4 w-4" /> Manage Salaries
              </button>
            )}
            <button className="btn-primary text-xs py-2" onClick={() => { setEditingTeacher(null); setEditingStaff(null); setIsAdding(true); }}>
              <Plus className="h-4 w-4" /> Add {activeTab === "teachers" ? "Teacher" : "Staff"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "teachers", label: "Teachers", icon: UserCheck, count: teachers.length },
            { key: "staff", label: "Other Staff", icon: Briefcase, count: staff.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key as any); setSearch(""); setIsAdding(false); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                activeTab === tab.key ? "bg-primary-100 text-primary-700" : "bg-gray-200 text-gray-500"
              )}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="dash-card p-4 bg-white flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder={activeTab === "teachers" ? "Search by name, email, or code..." : "Search by name or role..."}
              className="form-input pl-10 h-10 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="dash-card overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-16 gap-2 text-red-500">
              <p className="text-sm font-semibold">Failed to load</p>
              <p className="text-xs text-gray-400">{error}</p>
              <button onClick={fetchData} className="btn-ghost text-xs mt-2">Try Again</button>
            </div>
          ) : activeTab === "teachers" ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Specialty</th>
                  <th>Qualification</th>
                  <th>Experience</th>
                  <th>Salary</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    {teachers.length === 0 ? "No teachers yet. Add one above!" : "No teachers match your search."}
                  </td></tr>
                )}
                {filteredTeachers.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {t.image ? (
                          <img src={t.image} alt={t.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs">
                            {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{t.teacherCode} · {t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="pill pill-primary text-[10px] py-0.5">{t.specialization}</span></td>
                    <td><span className="text-xs text-gray-600 font-medium">{t.qualification}</span></td>
                    <td><span className="text-xs text-gray-500">{t.experience ? `${t.experience} Yrs` : "—"}</span></td>
                    <td><span className="text-xs text-gray-600 font-bold">{t.salary ? `PKR ${t.salary.toLocaleString()}` : "—"}</span></td>
                    <td className="text-gray-400 text-xs">{t.joinDate}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingTeacher(t)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent transition-colors"
                          title="Edit"
                        ><Edit className="h-4 w-4" /></button>
                        <button
                          onClick={() => { setDeleteError(null); setDeletingId({ id: t.id, name: t.name, type: "teacher" }); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent transition-colors"
                          title="Delete"
                        ><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role / Title</th>
                  <th>Phone</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    {staff.length === 0 ? "No staff added yet." : "No staff match your search."}
                  </td></tr>
                )}
                {filteredStaff.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {s.image ? (
                          <img src={s.image} alt={s.name} className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                            {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                          <p className="text-[10px] text-gray-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="pill bg-gray-100 text-gray-600 text-[10px] py-0.5">{s.staffRole || "—"}</span></td>
                    <td><span className="text-xs text-gray-500">{s.phone || "—"}</span></td>
                    <td><span className="text-xs text-gray-600 font-bold">{s.salary ? `PKR ${s.salary.toLocaleString()}` : "—"}</span></td>
                    <td>
                      <span className={cn("pill text-[10px] py-0.5", s.isActive ? "pill-success" : "bg-gray-100 text-gray-500")}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-gray-400 text-xs">{s.createdAt}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingStaff(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent transition-colors"
                          title="Edit"
                        ><Edit className="h-4 w-4" /></button>
                        <button
                          onClick={() => { setDeleteError(null); setDeletingId({ id: s.id, name: s.name, type: "staff" }); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent transition-colors"
                          title="Delete"
                        ><Trash2 className="h-4 w-4" /></button>
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
