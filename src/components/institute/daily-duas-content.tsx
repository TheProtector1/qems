"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Plus, Edit2, Trash2, X, Users, Sparkles, BookOpen,
  Loader2, Search, ChevronRight, Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DUA_CATEGORIES,
  DUA_PRIORITIES,
  DUA_STATUSES,
  getDuaCategoryMeta,
  getDuaPriorityMeta,
  getDuaStatusMeta,
  DUA_ROLLUP_LABELS,
  type DuaRollupStatus,
} from "@/lib/daily-dua";

type TeacherOption = {
  id: string;
  user: { id: string; name: string; image: string | null };
  _count: { students: number };
};

type Assignment = {
  id: string;
  teacherId: string;
  teacher: TeacherOption;
};

type ClassProgress = {
  id: string;
  classId: string;
  status: string;
  notes: string | null;
  taughtAt: string | null;
  completedAt: string | null;
  class: { id: string; name: string; programType: string };
  teacher?: { user: { name: string } } | null;
};

type DuaStats = {
  completed: number;
  taught: number;
  pending: number;
  total: number;
  percent: number;
};

type Dua = {
  id: string;
  title: string;
  arabicText: string;
  urduTranslation: string;
  transliteration: string | null;
  reference: string | null;
  notes: string | null;
  category: string;
  priority: string;
  isActive: boolean;
  classProgress: ClassProgress[];
  assignments: Assignment[];
  stats: DuaStats;
  rollup: DuaRollupStatus;
  expectedClassCount: number;
};

type ApiSummary = {
  activeDuas: number;
  fullyComplete: number;
  teachersInvolved: number;
  classCompletionRate: number;
};

function ProgressRing({ percent, size = 48 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#166534"
        strokeWidth={4}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

export function DailyDuasContent() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [apiSummary, setApiSummary] = useState<ApiSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "DONE">("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDua, setEditingDua] = useState<Dua | null>(null);
  const [viewingProgressDua, setViewingProgressDua] = useState<Dua | null>(null);
  const [progressSearch, setProgressSearch] = useState("");

  const [title, setTitle] = useState("");
  const [arabicText, setArabicText] = useState("");
  const [urduTranslation, setUrduTranslation] = useState("");
  const [transliteration, setTransliteration] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("DAILY");
  const [priority, setPriority] = useState("MEDIUM");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [teachersError, setTeachersError] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    try {
      setTeachersError(null);
      const res = await fetch("/api/institute/teachers");
      if (!res.ok) {
        setTeachersError("Could not load teachers. Try refreshing the page.");
        return;
      }
      const data = await res.json();
      const rows: TeacherOption[] = (data.teachers || [])
        .filter((t: { isActive?: boolean; user?: { isActive?: boolean; name?: string } }) =>
          t.isActive !== false && t.user?.isActive !== false
        )
        .map((t: {
          id: string;
          userId: string;
          user?: { id?: string; name?: string; image?: string | null };
          _count?: { students: number };
        }) => ({
          id: t.id,
          user: {
            id: t.user?.id || t.userId,
            name: t.user?.name || "Teacher",
            image: t.user?.image || null,
          },
          _count: { students: t._count?.students ?? 0 },
        }));
      setTeachers(rows);
    } catch {
      setTeachersError("Could not load teachers.");
    }
  }, []);

  const fetchDuas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/institute/daily-duas");
      if (res.ok) {
        const data = await res.json();
        setDuas(data.duas || []);
        setApiSummary(data.summary || null);
        if (Array.isArray(data.teachers) && data.teachers.length > 0) {
          setTeachers(data.teachers);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuas();
    loadTeachers();
  }, [loadTeachers]);

  const filteredDuas = useMemo(() => {
    return duas.filter((d) => {
      const catOk = categoryFilter === "ALL" || d.category === categoryFilter;
      const statusOk =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && d.isActive) ||
        (statusFilter === "DONE" && d.rollup === "DONE");
      return catOk && statusOk;
    });
  }, [duas, categoryFilter, statusFilter]);

  const stats = apiSummary || {
    activeDuas: duas.filter((d) => d.isActive).length,
    fullyComplete: duas.filter((d) => d.rollup === "DONE").length,
    teachersInvolved: new Set(duas.flatMap((d) => d.assignments.map((a) => a.teacherId))).size,
    classCompletionRate: 0,
  };

  const resetForm = () => {
    setTitle("");
    setArabicText("");
    setUrduTranslation("");
    setTransliteration("");
    setReference("");
    setNotes("");
    setCategory("DAILY");
    setPriority("MEDIUM");
    setSelectedTeacherIds([]);
    setEditingDua(null);
  };

  const openNewModal = () => {
    resetForm();
    loadTeachers();
    setIsModalOpen(true);
  };

  const openEditModal = (dua: Dua) => {
    setEditingDua(dua);
    setTitle(dua.title);
    setArabicText(dua.arabicText);
    setUrduTranslation(dua.urduTranslation);
    setTransliteration(dua.transliteration || "");
    setReference(dua.reference || "");
    setNotes(dua.notes || "");
    setCategory(dua.category || "DAILY");
    setPriority(dua.priority || "MEDIUM");
    setSelectedTeacherIds(dua.assignments.map((a) => a.teacherId));
    loadTeachers();
    setIsModalOpen(true);
  };

  const toggleTeacher = (id: string) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const assignAllTeachers = () => {
    setSelectedTeacherIds(teachers.map((t) => t.id));
  };

  const saveDua = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherIds.length) return;
    setSaving(true);
    try {
      const payload = {
        title,
        arabicText,
        urduTranslation,
        transliteration,
        reference,
        notes,
        category,
        priority,
        teacherIds: selectedTeacherIds,
      };
      const res = editingDua
        ? await fetch(`/api/institute/daily-duas/${editingDua.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/institute/daily-duas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        fetchDuas();
        setIsModalOpen(false);
        resetForm();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save dua. Make sure required fields are filled and teachers selected.");
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (dua: Dua) => {
    await fetch(`/api/institute/daily-duas/${dua.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !dua.isActive }),
    });
    fetchDuas();
  };

  const deleteDua = async (id: string) => {
    if (!confirm("Delete this dua?")) return;
    await fetch(`/api/institute/daily-duas/${id}`, { method: "DELETE" });
    fetchDuas();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading daily duas…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-violet-700 to-purple-800 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium mb-2">
              <Moon className="h-4 w-4" /> Daily Duas Program
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Teach Duas, Track Every Class</h2>
            <p className="text-indigo-100/90 text-sm mt-2 max-w-xl">
              Add duas with Arabic text and Urdu translation, assign teachers, and track class-level completion.
            </p>
          </div>
          <button onClick={openNewModal} className="btn-primary bg-white text-indigo-800 hover:bg-indigo-50 flex items-center gap-2 self-start md:self-auto">
            <Plus className="h-4 w-4" /> New Dua
          </button>
        </div>
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Active Duas", value: stats.activeDuas, icon: BookOpen },
            { label: "Teachers Involved", value: stats.teachersInvolved, icon: Users },
            { label: "Fully Complete", value: stats.fullyComplete, icon: Sparkles },
            { label: "Class Completion", value: `${stats.classCompletionRate}%`, icon: ChevronRight },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4">
              <s.icon className="h-4 w-4 text-indigo-200 mb-2" />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-indigo-100/80 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setCategoryFilter("ALL")}
          className={cn("pill text-xs", categoryFilter === "ALL" ? "pill-primary" : "bg-gray-100 text-gray-600")}
        >
          All categories
        </button>
        {DUA_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={cn(
              "pill text-xs transition-all",
              categoryFilter === cat.value ? `${cat.bg} ${cat.text} ring-2 ring-offset-1 ring-current` : "bg-gray-100 text-gray-600"
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
        <span className="w-px h-6 bg-gray-200 mx-1 hidden sm:block" />
        {(["ALL", "ACTIVE", "DONE"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "pill text-xs",
              statusFilter === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            {s === "ALL" ? "All status" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Dua grid */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredDuas.map((dua) => {
          const cat = getDuaCategoryMeta(dua.category);
          const pri = getDuaPriorityMeta(dua.priority);
          const pct = dua.stats?.percent ?? 0;
          const rollup = DUA_ROLLUP_LABELS[dua.rollup] || DUA_ROLLUP_LABELS.PENDING;
          const completed = dua.stats?.completed ?? 0;
          const taught = dua.stats?.taught ?? 0;
          const pending = dua.stats?.pending ?? 0;

          return (
            <div
              key={dua.id}
              className={cn(
                "dash-card overflow-hidden flex flex-col transition-all hover:shadow-md",
                !dua.isActive && "opacity-60"
              )}
            >
              <div className={cn("h-1.5 bg-gradient-to-r", cat.color)} />
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <span className={cn("pill text-[10px] py-0 mb-2 inline-flex", cat.bg, cat.text)}>
                      {cat.icon} {cat.label}
                    </span>
                    <h3 className="font-display font-bold text-gray-900 leading-snug">{dua.title}</h3>
                  </div>
                  <div className="relative flex-shrink-0">
                    <ProgressRing percent={pct} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-800">
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 mb-3">
                  <p dir="rtl" lang="ar" className="font-arabic text-lg leading-loose text-gray-900 text-right">
                    {dua.arabicText}
                  </p>
                  <p dir="rtl" lang="ur" className="font-urdu text-sm leading-loose text-gray-600 text-right mt-2 line-clamp-2">
                    {dua.urduTranslation}
                  </p>
                  {dua.reference && (
                    <p className="text-[10px] text-gray-400 mt-2">— {dua.reference}</p>
                  )}
                </div>

                <div className="space-y-3 mt-auto">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn("pill text-[10px] py-0", pri.pill)}>{pri.label}</span>
                    <span className={cn("pill text-[10px] py-0", rollup.pill)}>{rollup.label}</span>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Assigned Teachers</p>
                    {dua.assignments.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dua.assignments.map((a) => (
                          <span key={a.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                            <span className="h-4 w-4 rounded-full bg-indigo-700 text-white flex items-center justify-center text-[8px] font-bold">
                              {a.teacher.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                            </span>
                            {a.teacher.user.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600">No teachers assigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span><strong className="text-green-700">{completed}</strong> classes done</span>
                    <span><strong className="text-blue-700">{taught}</strong> taught</span>
                    <span><strong className="text-gray-700">{pending}</strong> pending</span>
                    <span className="text-gray-400">/ {dua.stats?.total ?? dua.expectedClassCount} classes</span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleStatus(dua)}
                  className={cn("pill text-[10px] cursor-pointer", dua.isActive ? "pill-success" : "bg-gray-200 text-gray-500")}
                >
                  {dua.isActive ? "Active" : "Paused"}
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => setViewingProgressDua(dua)} className="text-xs font-semibold text-primary-700 hover:underline">
                    Progress
                  </button>
                  <button onClick={() => openEditModal(dua)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteDua(dua.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredDuas.length === 0 && (
          <div className="col-span-full py-16 text-center dash-card border-dashed">
            <span className="text-5xl">🤲</span>
            <h3 className="mt-4 font-display font-bold text-gray-900">No duas yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Add your first daily dua with Arabic text and Urdu translation, then assign teachers to teach it.
            </p>
            <button onClick={openNewModal} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add First Dua
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-bold text-gray-900">
                {editingDua ? "Edit Dua" : "Add Daily Dua"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Enter the dua with translation and assign teachers who will teach it.</p>
            </div>
            <form onSubmit={saveDua} className="p-6 space-y-4">
              <div>
                <label className="form-label">Title <span className="text-red-500">*</span></label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" placeholder="e.g., Dua before eating" />
              </div>
              <div>
                <label className="form-label">Arabic Text <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  required
                  dir="rtl"
                  lang="ar"
                  value={arabicText}
                  onChange={(e) => setArabicText(e.target.value)}
                  className="form-input font-arabic text-lg leading-loose text-right"
                  placeholder="بِسْمِ اللَّهِ..."
                />
              </div>
              <div>
                <label className="form-label">Urdu Translation <span className="text-red-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  dir="rtl"
                  lang="ur"
                  value={urduTranslation}
                  onChange={(e) => setUrduTranslation(e.target.value)}
                  className="form-input font-urdu leading-loose text-right"
                  placeholder="اردو ترجمہ..."
                />
              </div>
              <div>
                <label className="form-label">Transliteration</label>
                <input type="text" value={transliteration} onChange={(e) => setTransliteration(e.target.value)} className="form-input" placeholder="Bismillah..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Reference</label>
                  <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="form-input" placeholder="e.g., Sahih Muslim 2018" />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
                    {DUA_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-input">
                    {DUA_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Teaching Notes</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" placeholder="Optional notes for teachers" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0">Assign Teachers <span className="text-red-500">*</span></label>
                  {teachers.length > 0 && (
                    <button type="button" onClick={assignAllTeachers} className="text-xs font-semibold text-primary-700 hover:underline">
                      Select all
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">Assigned teachers mark this dua once per class.</p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-3 rounded-xl border border-gray-200 bg-gray-50">
                  {teachers.length === 0 ? (
                    <div className="text-sm text-gray-500 w-full">
                      <p>No teachers found.</p>
                      {teachersError && <p className="text-amber-600 text-xs mt-1">{teachersError}</p>}
                      <Link href="/institute/teachers" className="text-primary-700 font-semibold text-xs hover:underline mt-1 inline-block">
                        Add teachers in Staff → Teachers
                      </Link>
                    </div>
                  ) : (
                    teachers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeacher(t.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                          selectedTeacherIds.includes(t.id)
                            ? "bg-indigo-700 text-white border-indigo-700"
                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                        )}
                      >
                        {t.user.name}
                        <span className="opacity-70">({t._count.students})</span>
                      </button>
                    ))
                  )}
                </div>
                {!selectedTeacherIds.length && (
                  <p className="text-xs text-amber-600 mt-1">Select at least one teacher.</p>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving || !selectedTeacherIds.length} className="btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDua ? "Save Changes" : "Create & Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {viewingProgressDua && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <span className={cn("pill text-[10px] py-0 mb-2", getDuaCategoryMeta(viewingProgressDua.category).bg, getDuaCategoryMeta(viewingProgressDua.category).text)}>
                  {getDuaCategoryMeta(viewingProgressDua.category).icon} {getDuaCategoryMeta(viewingProgressDua.category).label}
                </span>
                <h3 className="font-display text-lg font-bold text-gray-900">{viewingProgressDua.title}</h3>
                <p dir="rtl" lang="ar" className="font-arabic text-base text-gray-600 mt-1 text-right">
                  {viewingProgressDua.arabicText}
                </p>
              </div>
              <button onClick={() => { setViewingProgressDua(null); setProgressSearch(""); }} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:p-6 pb-0">
              {DUA_STATUSES.map((st) => {
                const count = st.value === "PENDING"
                  ? (viewingProgressDua.stats?.pending ?? 0)
                  : st.value === "COMPLETED"
                    ? (viewingProgressDua.stats?.completed ?? 0)
                    : (viewingProgressDua.stats?.taught ?? 0);
                return (
                  <div key={st.value} className="rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-lg">{st.icon}</p>
                    <p className="text-xl font-bold text-gray-900">{count}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{st.label}</p>
                  </div>
                );
              })}
              <div className="rounded-xl border border-gray-100 p-3 text-center">
                <p className="text-lg">🏫</p>
                <p className="text-xl font-bold text-gray-900">{viewingProgressDua.stats?.total ?? 0}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Classes</p>
              </div>
            </div>

            <div className="p-6 pt-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search classes or teachers…" value={progressSearch} onChange={(e) => setProgressSearch(e.target.value)} className="form-input pl-9 text-sm" />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(viewingProgressDua.classProgress || []).length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No class progress recorded yet. Teachers will mark duas per class from their portal.
                  </p>
                ) : (
                  (viewingProgressDua.classProgress || [])
                    .filter((p) => {
                      const q = progressSearch.toLowerCase();
                      return (
                        p.class.name.toLowerCase().includes(q) ||
                        (p.teacher?.user.name || "").toLowerCase().includes(q)
                      );
                    })
                    .map((prog) => {
                      const meta = getDuaStatusMeta(prog.status);
                      return (
                        <div key={prog.id} className={cn("p-3 rounded-xl border flex items-start justify-between gap-3", prog.status === "COMPLETED" ? "border-green-200 bg-green-50/30" : "border-gray-200")}>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{prog.class.name}</p>
                            <p className="text-[10px] text-gray-400">{prog.class.programType}</p>
                            {prog.notes && <p className="text-xs text-gray-600 italic mt-1">&ldquo;{prog.notes}&rdquo;</p>}
                            {prog.completedAt && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                Completed {new Date(prog.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={cn("pill text-[9px] py-0", meta.pill)}>{meta.icon} {meta.label}</span>
                            {prog.teacher && (
                              <p className="text-[10px] text-gray-400 mt-1">by {prog.teacher.user.name}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
