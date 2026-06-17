"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search, Plus, Download, Eye, Edit, Trash2,
  GraduationCap, BookOpen, CalendarCheck, Star,
  Filter, LayoutGrid, LayoutList, ChevronLeft, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle, User, Loader2, RefreshCw, XCircle
} from "lucide-react";
import Link from "next/link";
import { cn, getInitials } from "@/lib/utils";

type Student = {
  id: string;
  studentId: string;
  name: string;
  gender: "MALE" | "FEMALE";
  program: string;
  class: string;
  section: string;
  teacher: string;
  teacherId: string;
  currentJuz: number | null;
  qualityScore: number;
  attendancePct: number;
  status: "Excellent" | "On Track" | "Needs Attention" | "At Risk";
  admissionDate: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dateOfBirth: string;
  photo?: string;
  city: string;
  address: string;
};

const ALL_CLASSES = ["All Classes", "Hifz A", "Hifz B", "Hifz C", "Nazra 1", "Nazra 2", "Tajweed Adv", "Tajweed Basic"];
const ALL_SECTIONS = ["All Sections", "Section 1", "Section 2", "Section 3"];
const ALL_PROGRAMS = ["All Programs", "Hifz", "Nazra", "Tajweed"];

const statusMeta: Record<string, { pill: string; icon: React.ElementType; color: string }> = {
  "Excellent": { pill: "pill-success", icon: CheckCircle, color: "text-green-600" },
  "On Track": { pill: "pill-info", icon: TrendingUp, color: "text-blue-600" },
  "Needs Attention": { pill: "pill-warning", icon: AlertTriangle, color: "text-amber-600" },
  "At Risk": { pill: "pill-danger", icon: AlertTriangle, color: "text-red-600" },
};

const programColors: Record<string, string> = {
  Hifz: "bg-green-100 text-green-700",
  Nazra: "bg-blue-100 text-blue-700",
  Tajweed: "bg-violet-100 text-violet-700",
};

const avatarColors = [
  "from-emerald-400 to-green-600",
  "from-blue-400 to-indigo-600",
  "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-cyan-600",
];

// ─── Edit Student Modal ────────────────────────────────────────
function EditStudentModal({
  student,
  teachers,
  onClose,
  onSave,
}: {
  student: Student;
  teachers: any[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [fullName, setFullName] = useState(student.name);
  const [gender, setGender] = useState(student.gender);
  const [dateOfBirth, setDateOfBirth] = useState(student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "");
  const [address, setAddress] = useState(student.address || "");
  const [city, setCity] = useState(student.city || "");
  const [program, setProgram] = useState(student.program);
  const [teacherId, setTeacherId] = useState(student.teacherId || "");
  const [currentJuz, setCurrentJuz] = useState(student.currentJuz?.toString() || "");
  const [fatherName, setFatherName] = useState(student.parentName);
  const [parentEmail, setParentEmail] = useState(student.parentEmail || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/institute/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          gender,
          dateOfBirth,
          address,
          city,
          program,
          teacherId: teacherId || null,
          currentJuz: program === "Hifz" ? currentJuz : null,
          fatherName,
          parentEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update student.");
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold">Edit Student Profile</h2>
            <p className="text-primary-200 text-xs mt-0.5">ID: {student.studentId}</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Student Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="form-input text-xs"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="form-input text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Program Specialty</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Hifz">Hifz</option>
                <option value="Nazra">Nazra</option>
                <option value="Tajweed">Tajweed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="form-input text-xs"
              >
                <option value="">No Teacher assigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name || t.user?.name || "Teacher"}</option>
                ))}
              </select>
            </div>
          </div>

          {program === "Hifz" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Juz progress</label>
              <input
                type="number"
                min="1"
                max="30"
                value={currentJuz}
                onChange={(e) => setCurrentJuz(e.target.value)}
                className="form-input text-xs"
                placeholder="Juz 1-30"
              />
            </div>
          )}

          <div className="border-t border-gray-100 my-4 pt-4">
            <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Parent Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Father Name</label>
                <input
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="form-input text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Home Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input text-xs"
                placeholder="Street address"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-100">
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Student Card UI Component ────────────────────────────────
function StudentCard({ student, onEdit, onDelete }: { student: Student; onEdit: () => void; onDelete: () => void }) {
  const statusInfo = statusMeta[student.status] || statusMeta["On Track"];
  const StatusIcon = statusInfo.icon;
  const colorIdx = student.name.charCodeAt(0) % avatarColors.length;
  const avatarGrad = student.gender === "FEMALE"
    ? "from-pink-400 to-rose-600"
    : avatarColors[colorIdx];

  return (
    <div className="dash-card bg-white group hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden flex flex-col">
      {/* Top Color Band */}
      <div className={cn(
        "h-1.5 w-full",
        student.status === "Excellent" ? "bg-gradient-to-r from-green-400 to-emerald-600" :
        student.status === "On Track" ? "bg-gradient-to-r from-blue-400 to-indigo-500" :
        student.status === "Needs Attention" ? "bg-gradient-to-r from-amber-400 to-orange-500" :
        "bg-gradient-to-r from-red-400 to-rose-600"
      )} />

      <div className="p-5 flex flex-col flex-1">
        {/* Avatar + Name */}
        <div className="flex items-start gap-4 mb-4">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-sm bg-gradient-to-br",
            avatarGrad
          )}>
            {getInitials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{student.name}</h3>
            <p className="text-[11px] font-mono text-primary-700 mt-0.5">{student.studentId}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", programColors[student.program])}>
                {student.program}
              </span>
              <span className="text-[10px] text-gray-400">{student.class}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar (Hifz only) */}
        {student.currentJuz && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-400 font-medium">Hifz Progress</span>
              <span className="text-[10px] font-bold text-primary-700">Juz {student.currentJuz}/30</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all duration-700"
                style={{ width: `${(student.currentJuz / 30) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 mx-auto mb-0.5" />
            <p className="text-sm font-bold text-gray-900">{student.qualityScore.toFixed(1)}</p>
            <p className="text-[9px] text-gray-400">Quality</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
            <CalendarCheck className={cn("h-3.5 w-3.5 mx-auto mb-0.5",
              student.attendancePct >= 90 ? "text-green-500" : student.attendancePct >= 75 ? "text-amber-500" : "text-red-500"
            )} />
            <p className={cn("text-sm font-bold",
              student.attendancePct >= 90 ? "text-green-600" : student.attendancePct >= 75 ? "text-amber-600" : "text-red-500"
            )}>{student.attendancePct}%</p>
            <p className="text-[9px] text-gray-400">Attendance</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-gray-50 border border-gray-100">
            <StatusIcon className={cn("h-3.5 w-3.5 mx-auto mb-0.5", statusInfo.color)} />
            <div className={cn("text-[9px] font-bold mt-0.5", statusInfo.color)}>
              {student.status === "Needs Attention" ? "Attention" : student.status}
            </div>
            <p className="text-[9px] text-gray-400">Status</p>
          </div>
        </div>

        {/* Parent Info */}
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-4">
          <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="truncate">{student.parentName} · {student.parentPhone}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
          <Link
            href={`/institute/students/${student.id}`}
            className="flex-1 btn-primary text-xs py-2 justify-center"
            id={`btn-view-student-${student.id}`}
          >
            <Eye className="h-3.5 w-3.5" /> View Profile
          </Link>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition-colors"
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-colors"
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

type ViewMode = "grid" | "list";

interface StudentsContentProps {
  backHref?: string;
  addHref?: string;
  role?: "institute" | "teacher" | "admin";
}

export function StudentsContent({ backHref, addHref = "/institute/students/new", role = "institute" }: StudentsContentProps) {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState(
    searchParams.get("program") && ALL_PROGRAMS.includes(searchParams.get("program")!)
      ? searchParams.get("program")!
      : "All Programs"
  );
  const [classFilter, setClassFilter] = useState("All Classes");
  const [sectionFilter, setSectionFilter] = useState("All Sections");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchStudentsAndTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const resSt = await fetch("/api/institute/students");
      if (!resSt.ok) throw new Error("Failed to load students database.");
      const dataSt = await resSt.json();

      const mapped: Student[] = (dataSt.students || []).map((s: any) => {
        // Map program type to correct casing
        let prog = "Hifz";
        if (s.programType === "NAZRA") prog = "Nazra";
        if (s.programType === "TAJWEED") prog = "Tajweed";

        return {
          id: s.id,
          studentId: s.studentId,
          name: s.fullName,
          gender: s.gender,
          program: prog,
          class: prog + " Class", // Display label
          section: "Section 1",
          teacher: s.teacher?.user?.name || "Unassigned",
          teacherId: s.teacherId || "",
          currentJuz: s.currentJuz,
          qualityScore: s.qualityScore ?? 8.5,
          attendancePct: s.attendancePct ?? 95,
          status: s.isActive ? "On Track" : "Needs Attention",
          admissionDate: s.admissionDate
            ? new Date(s.admissionDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
            : "—",
          parentName: s.parent?.user?.name || "Parent",
          parentPhone: s.parent?.user?.email || "—",
          parentEmail: s.parent?.user?.email || "",
          dateOfBirth: s.dateOfBirth,
          city: s.city || "Islamabad",
          address: s.address || "",
        };
      });

      setStudents(mapped);

      // 2. Fetch Teachers for dropdown select
      const resTe = await fetch("/api/institute/teachers");
      if (resTe.ok) {
        const dataTe = await resTe.json();
        setTeachers(
          (dataTe.teachers || []).map((t: any) => ({
            id: t.id,
            name: t.user?.name || "Teacher",
          }))
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this student? All login credentials will be removed.")) {
      return;
    }
    try {
      const res = await fetch(`/api/institute/students/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete student.");
      }
      fetchStudentsAndTeachers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchStudentsAndTeachers();
  }, []);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (!editId || students.length === 0) return;
    const match = students.find((s) => s.id === editId);
    if (match) setEditingStudent(match);
  }, [searchParams, students]);

  const perPage = viewMode === "grid" ? 9 : 8;

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.parentName.toLowerCase().includes(q);
    const matchProgram = programFilter === "All Programs" || s.program === programFilter;
    const matchClass = classFilter === "All Classes" || s.class === classFilter;
    const matchSection = sectionFilter === "All Sections" || s.section === sectionFilter;
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchProgram && matchClass && matchSection && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const counts = {
    total: students.length,
    hifz: students.filter(s => s.program === "Hifz").length,
    nazra: students.filter(s => s.program === "Nazra").length,
    atRisk: students.filter(s => ["Needs Attention", "At Risk"].includes(s.status)).length,
  };

  return (
    <>
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          teachers={teachers}
          onClose={() => setEditingStudent(null)}
          onSave={fetchStudentsAndTeachers}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading">Students</h2>
            <p className="text-sm text-gray-500 mt-0.5">{students.length} total students enrolled</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost text-sm py-2" onClick={fetchStudentsAndTeachers} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            {role !== "teacher" && (
              <Link href={addHref} className="btn-primary text-sm py-2" id="btn-add-student">
                <Plus className="h-4 w-4" /> Add Student
              </Link>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: counts.total, icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
            { label: "Hifz", value: counts.hifz, icon: BookOpen, color: "text-green-600 bg-green-50" },
            { label: "Nazra", value: counts.nazra, icon: Star, color: "text-amber-600 bg-amber-50" },
            { label: "Need Support", value: counts.atRisk, icon: AlertTriangle, color: "text-red-600 bg-red-50" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="kpi-card p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", c.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-gray-900">{c.value}</p>
                  <p className="text-xs text-gray-500">{c.label} students</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="dash-card p-4 bg-white space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, ID, or parent…"
                className="form-input pl-10"
                id="input-search-students"
              />
            </div>
            {/* View toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl self-center">
              <button
                onClick={() => setViewMode("grid")}
                className={cn("p-2 rounded-lg transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-primary-700" : "text-gray-400 hover:text-gray-600")}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("p-2 rounded-lg transition-colors", viewMode === "list" ? "bg-white shadow-sm text-primary-700" : "text-gray-400 hover:text-gray-600")}
                title="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <select
              value={programFilter}
              onChange={(e) => { setProgramFilter(e.target.value); setPage(1); }}
              className="form-input w-auto text-xs py-1.5"
              id="select-program-filter"
            >
              {ALL_PROGRAMS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
              className="form-input w-auto text-xs py-1.5"
              id="select-class-filter"
            >
              {ALL_CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={sectionFilter}
              onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
              className="form-input w-auto text-xs py-1.5"
              id="select-section-filter"
            >
              {ALL_SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            {/* Status filter pills */}
            <div className="flex gap-1.5 ml-1 flex-wrap">
              {(["ALL", "Excellent", "On Track", "Needs Attention", "At Risk"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors border",
                    statusFilter === s
                      ? "bg-primary-700 text-white border-primary-700"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  )}
                >
                  {s === "ALL" ? "All Status" : s}
                </button>
              ))}
            </div>
            {(search || programFilter !== "All Programs" || classFilter !== "All Classes" || sectionFilter !== "All Sections" || statusFilter !== "ALL") && (
              <button
                onClick={() => { setSearch(""); setProgramFilter("All Programs"); setClassFilter("All Classes"); setSectionFilter("All Sections"); setStatusFilter("ALL"); setPage(1); }}
                className="text-[11px] text-red-500 hover:text-red-700 font-semibold ml-auto animate-fade-in"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-500 px-0.5">
          Showing {filtered.length} of {students.length} students
        </p>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500 bg-white rounded-2xl border border-gray-100">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            <span className="text-sm font-medium">Loading student records...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500 bg-white rounded-2xl border border-red-100">
            <p className="text-sm font-semibold">Failed to load student directory</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button onClick={fetchStudentsAndTeachers} className="btn-ghost text-xs mt-2">Try Again</button>
          </div>
        ) : (
          <>
            {/* CARD GRID VIEW */}
            {viewMode === "grid" && (
              <>
                {paginated.length === 0 ? (
                  <div className="dash-card p-16 text-center">
                    <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No students found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {paginated.map((s) => (
                      <StudentCard
                        key={s.id}
                        student={s}
                        onEdit={() => setEditingStudent(s)}
                        onDelete={() => handleDelete(s.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* LIST VIEW */}
            {viewMode === "list" && (
              <div className="dash-card overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>ID</th>
                        <th>Class / Section</th>
                        <th>Program</th>
                        <th>Progress</th>
                        <th>Quality</th>
                        <th>Attendance</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-gray-400">No students found.</td>
                        </tr>
                      )}
                      {paginated.map((s) => {
                        const colorIdx = s.name.charCodeAt(0) % avatarColors.length;
                        const avatarGrad = s.gender === "FEMALE" ? "from-pink-400 to-rose-600" : avatarColors[colorIdx];
                        return (
                          <tr key={s.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white bg-gradient-to-br",
                                  avatarGrad
                                )}>
                                  {getInitials(s.name)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 whitespace-nowrap">{s.name}</p>
                                  <p className="text-xs text-gray-400">{s.parentName} · {s.parentPhone}</p>
                                </div>
                              </div>
                            </td>
                            <td><span className="font-mono text-xs text-gray-500">{s.studentId}</span></td>
                            <td>
                              <p className="text-xs font-semibold text-gray-800">{s.class}</p>
                              <p className="text-[10px] text-gray-400">{s.section}</p>
                            </td>
                            <td><span className={cn("pill text-xs", programColors[s.program])}>{s.program}</span></td>
                            <td>
                              {s.currentJuz ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${(s.currentJuz / 30) * 100}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-600">Juz {s.currentJuz}/30</span>
                                </div>
                              ) : <span className="text-xs text-gray-400">—</span>}
                            </td>
                            <td>
                              <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                                <span className="font-semibold text-gray-900 text-sm">{s.qualityScore}</span>
                              </div>
                            </td>
                            <td>
                              <span className={cn("text-sm font-semibold",
                                s.attendancePct >= 90 ? "text-green-600" : s.attendancePct >= 75 ? "text-amber-600" : "text-red-500"
                              )}>{s.attendancePct}%</span>
                            </td>
                            <td>
                              <span className={cn("pill", statusMeta[s.status]?.pill || "pill-info")}>{s.status}</span>
                            </td>
                            <td className="text-right">
                              <div className="flex justify-end items-center gap-1">
                                <Link href={`/institute/students/${s.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 transition-colors" title="View">
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => setEditingStudent(s)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <span>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)} className={cn("h-8 w-8 rounded-lg text-sm font-medium transition-colors", p === page ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-600")}>{p}</button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Pagination */}
            {viewMode === "grid" && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={cn("h-9 w-9 rounded-xl text-sm font-medium transition-colors", p === page ? "bg-primary text-white" : "hover:bg-gray-100 text-gray-600")}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
