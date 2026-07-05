"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award, BookOpen, Calendar, Edit2, GraduationCap, Loader2, MapPin,
  Plus, Search, Sparkles, Star, Trash2, User, X, Briefcase, Quote,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { COMPLETION_TYPE_LABELS, PROGRAM_LABELS } from "@/lib/alumni";
import { StudentAvatar } from "@/components/common/student-avatar";

type Alumni = {
  id: string;
  fullName: string;
  photo: string | null;
  programType: string;
  completionType: string;
  completedAt: string;
  batchYear: string | null;
  studentIdLabel: string | null;
  teacherName: string | null;
  totalDaysHifz: number | null;
  occupation: string | null;
  currentStudy: string | null;
  city: string | null;
  achievements: string | null;
  testimonial: string | null;
  isFeatured: boolean;
  isPublic: boolean;
  studentId: string | null;
};

type Candidate = {
  id: string;
  fullName: string;
  studentId: string;
  photo: string | null;
  programType: string;
  hifzCompletedAt: string | null;
  city: string | null;
  teacherName: string | null;
};

type Summary = {
  total: number;
  featured: number;
  hifzCompleters: number;
  completedThisYear: number;
};

const emptyForm = () => ({
  fullName: "",
  completedAt: new Date().toISOString().split("T")[0],
  programType: "HIFZ",
  completionType: "HIFZ_FULL",
  batchYear: new Date().getFullYear().toString(),
  teacherName: "",
  occupation: "",
  currentStudy: "",
  city: "",
  achievements: "",
  testimonial: "",
  isFeatured: false,
  isPublic: true,
});

export function AlumniContent() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [batchYears, setBatchYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [tab, setTab] = useState<"all" | "featured" | "hifz">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Alumni | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Alumni | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ candidates: "true" });
      if (search.trim()) params.set("search", search.trim());
      if (programFilter) params.set("program", programFilter);
      if (yearFilter) params.set("year", yearFilter);
      if (tab === "featured") params.set("featured", "true");

      const res = await fetch(`/api/institute/alumni?${params}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      let list: Alumni[] = data.alumni ?? [];
      if (tab === "hifz") {
        list = list.filter((a) => a.completionType === "HIFZ_FULL");
      }
      setAlumni(list);
      setCandidates(data.candidates ?? []);
      setSummary(data.summary ?? null);
      setBatchYears(data.batchYears ?? []);
    } catch {
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  }, [search, programFilter, yearFilter, tab]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openEdit = (a: Alumni) => {
    setEditing(a);
    setForm({
      fullName: a.fullName,
      completedAt: a.completedAt,
      programType: a.programType,
      completionType: a.completionType,
      batchYear: a.batchYear ?? a.completedAt.slice(0, 4),
      teacherName: a.teacherName ?? "",
      occupation: a.occupation ?? "",
      currentStudy: a.currentStudy ?? "",
      city: a.city ?? "",
      achievements: a.achievements ?? "",
      testimonial: a.testimonial ?? "",
      isFeatured: a.isFeatured,
      isPublic: a.isPublic,
    });
    setShowForm(true);
  };

  const saveForm = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        batchYear: form.batchYear || form.completedAt.slice(0, 4),
      };
      const res = await fetch(
        editing ? `/api/institute/alumni/${editing.id}` : "/api/institute/alumni",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save");
        return;
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
      await load();
    } finally {
      setSaving(false);
    }
  };

  const promoteCandidate = async (studentId: string) => {
    setPromotingId(studentId);
    try {
      const res = await fetch("/api/institute/alumni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to add alumni");
        return;
      }
      await load();
    } finally {
      setPromotingId(null);
    }
  };

  const removeAlumni = async (id: string) => {
    if (!confirm("Remove this alumni record? The student profile will remain.")) return;
    const res = await fetch(`/api/institute/alumni/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDetail(null);
      await load();
    }
  };

  const toggleFeatured = async (a: Alumni) => {
    await fetch(`/api/institute/alumni/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !a.isFeatured }),
    });
    await load();
  };

  const statCards = useMemo(
    () => [
      { label: "Total alumni", value: summary?.total ?? 0, icon: GraduationCap, color: "text-primary-700 bg-primary-50" },
      { label: "Hifz completers", value: summary?.hifzCompleters ?? 0, icon: BookOpen, color: "text-emerald-700 bg-emerald-50" },
      { label: "This year", value: summary?.completedThisYear ?? 0, icon: Calendar, color: "text-blue-700 bg-blue-50" },
      { label: "Featured", value: summary?.featured ?? 0, icon: Star, color: "text-amber-700 bg-amber-50" },
    ],
    [summary]
  );

  return (
    <div className="space-y-6">
      <div className="dash-card bg-gradient-to-br from-primary-900 via-primary-800 to-emerald-900 text-white p-6 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-200 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="h-4 w-4" /> Institute legacy
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">
            Alumni — Huffāẓ & Quran graduates
          </h2>
          <p className="text-primary-100 text-sm mt-2 max-w-2xl leading-relaxed">
            Celebrate students who have completed the full Quran (Hifz) and other Quran programs.
            Alumni are added automatically when Hifz is completed, or you can promote graduates manually.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="dash-card bg-white p-4 sm:p-5">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3", s.color)}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {candidates.length > 0 && (
        <div className="dash-card bg-amber-50/80 border border-amber-200/80 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display font-bold text-gray-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Ready to add as alumni
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {candidates.length} student{candidates.length !== 1 ? "s" : ""} completed Hifz but are not yet on the alumni roll.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white border border-amber-100 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StudentAvatar name={c.fullName} photo={c.photo} size="sm" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{c.fullName}</p>
                    <p className="text-xs text-gray-500">
                      {c.studentId}
                      {c.hifzCompletedAt && ` · Completed ${formatDate(c.hifzCompletedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/institute/students/${c.id}`} className="btn-ghost text-xs py-1.5">
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => promoteCandidate(c.id)}
                    disabled={promotingId === c.id}
                    className="btn-primary text-xs py-1.5"
                  >
                    {promotingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add to alumni"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-card bg-white p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "hifz", "featured"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  tab === t ? "bg-primary-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {t === "all" ? "All alumni" : t === "hifz" ? "Hifz completers" : "Featured"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search name, ID, city…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 w-full text-sm"
              />
            </div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="input text-sm w-auto"
            >
              <option value="">All years</option>
              {batchYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setEditing(null); setForm(emptyForm()); setShowForm(true); }}
              className="btn-primary text-sm py-2"
            >
              <Plus className="h-4 w-4" /> Add alumni
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : alumni.length === 0 ? (
        <div className="dash-card bg-white p-12 text-center border border-dashed border-gray-200">
          <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-700">No alumni yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            When students complete full Hifz they appear here automatically. You can also add graduates manually.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {alumni.map((a) => (
            <div
              key={a.id}
              className={cn(
                "dash-card bg-white p-5 border transition-shadow hover:shadow-md cursor-pointer relative group",
                a.isFeatured ? "border-amber-200 ring-1 ring-amber-100" : "border-gray-100"
              )}
              onClick={() => setDetail(a)}
            >
              {a.isFeatured && (
                <span className="absolute top-3 right-3 pill pill-warning text-[10px]">
                  <Star className="h-3 w-3" /> Featured
                </span>
              )}
              <div className="flex items-start gap-4">
                {a.photo ? (
                  <img src={a.photo} alt="" className="h-14 w-14 rounded-2xl object-cover flex-shrink-0" />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {getInitials(a.fullName)}
                  </div>
                )}
                <div className="min-w-0 flex-1 pr-8">
                  <h3 className="font-display font-bold text-gray-900 truncate">{a.fullName}</h3>
                  <p className="text-xs text-primary-700 font-medium mt-0.5">
                    {COMPLETION_TYPE_LABELS[a.completionType as keyof typeof COMPLETION_TYPE_LABELS] ?? a.completionType}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                    {a.batchYear && <span>Batch {a.batchYear}</span>}
                    <span>{formatDate(a.completedAt)}</span>
                    {a.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {a.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {(a.occupation || a.currentStudy) && (
                <p className="text-xs text-gray-600 mt-3 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  {a.occupation || a.currentStudy}
                </p>
              )}
              {a.testimonial && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">&ldquo;{a.testimonial}&rdquo;</p>
              )}
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleFeatured(a); }}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  <Star className={cn("h-3.5 w-3.5", a.isFeatured && "fill-amber-400 text-amber-500")} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEdit(a); }}
                  className="btn-ghost text-xs py-1 px-2"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                {a.studentId && (
                  <Link
                    href={`/institute/students/${a.studentId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn-ghost text-xs py-1 px-2 ml-auto"
                  >
                    <User className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDetail(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {detail.photo ? (
                  <img src={detail.photo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xl">
                    {getInitials(detail.fullName)}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">{detail.fullName}</h3>
                  <p className="text-sm text-primary-700">
                    {COMPLETION_TYPE_LABELS[detail.completionType as keyof typeof COMPLETION_TYPE_LABELS]}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-3">
                {detail.studentIdLabel && (
                  <>
                    <dt className="text-gray-500">Student ID</dt>
                    <dd className="font-medium">{detail.studentIdLabel}</dd>
                  </>
                )}
                <dt className="text-gray-500">Program</dt>
                <dd>{PROGRAM_LABELS[detail.programType as keyof typeof PROGRAM_LABELS] ?? detail.programType}</dd>
                <dt className="text-gray-500">Completed</dt>
                <dd>{formatDate(detail.completedAt)}</dd>
                {detail.batchYear && (
                  <>
                    <dt className="text-gray-500">Batch</dt>
                    <dd>{detail.batchYear}</dd>
                  </>
                )}
                {detail.teacherName && (
                  <>
                    <dt className="text-gray-500">Teacher</dt>
                    <dd>{detail.teacherName}</dd>
                  </>
                )}
                {detail.totalDaysHifz && (
                  <>
                    <dt className="text-gray-500">Days in Hifz</dt>
                    <dd>{detail.totalDaysHifz.toLocaleString()}</dd>
                  </>
                )}
                {detail.city && (
                  <>
                    <dt className="text-gray-500">City</dt>
                    <dd>{detail.city}</dd>
                  </>
                )}
                {detail.occupation && (
                  <>
                    <dt className="text-gray-500">Occupation</dt>
                    <dd>{detail.occupation}</dd>
                  </>
                )}
                {detail.currentStudy && (
                  <>
                    <dt className="text-gray-500">Current study</dt>
                    <dd>{detail.currentStudy}</dd>
                  </>
                )}
              </dl>
              {detail.achievements && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Achievements</p>
                  <p className="text-gray-700 leading-relaxed">{detail.achievements}</p>
                </div>
              )}
              {detail.testimonial && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <Quote className="h-4 w-4 text-gray-400 mb-2" />
                  <p className="text-gray-700 italic leading-relaxed">{detail.testimonial}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
              {detail.studentId && (
                <Link href={`/institute/students/${detail.studentId}`} className="btn-ghost text-sm">
                  View student profile
                </Link>
              )}
              <button type="button" onClick={() => { openEdit(detail); setDetail(null); }} className="btn-ghost text-sm">
                Edit
              </button>
              <button type="button" onClick={() => removeAlumni(detail.id)} className="btn-ghost text-sm text-red-600">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">{editing ? "Edit alumni" : "Add alumni"}</h3>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input w-full"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Completion date</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={form.completedAt}
                    onChange={(e) => setForm({ ...form, completedAt: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Batch year</label>
                  <input
                    className="input w-full"
                    value={form.batchYear}
                    onChange={(e) => setForm({ ...form, batchYear: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Program</label>
                  <select
                    className="input w-full"
                    value={form.programType}
                    onChange={(e) => setForm({ ...form, programType: e.target.value })}
                  >
                    {Object.entries(PROGRAM_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Completion type</label>
                  <select
                    className="input w-full"
                    value={form.completionType}
                    onChange={(e) => setForm({ ...form, completionType: e.target.value })}
                  >
                    {Object.entries(COMPLETION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Teacher (optional)</label>
                <input
                  className="input w-full"
                  value={form.teacherName}
                  onChange={(e) => setForm({ ...form, teacherName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input className="input w-full" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div>
                  <label className="label">Occupation</label>
                  <input className="input w-full" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Current study / madrasa</label>
                <input className="input w-full" value={form.currentStudy} onChange={(e) => setForm({ ...form, currentStudy: e.target.value })} />
              </div>
              <div>
                <label className="label">Achievements</label>
                <textarea className="input w-full min-h-[72px]" value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
              </div>
              <div>
                <label className="label">Testimonial</label>
                <textarea className="input w-full min-h-[72px]" value={form.testimonial} onChange={(e) => setForm({ ...form, testimonial: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Featured on About page
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
                  Public profile
                </label>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={saveForm} disabled={saving || !form.fullName.trim()} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save changes" : "Add alumni"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
