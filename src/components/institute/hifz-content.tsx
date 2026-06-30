"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Star, CheckCircle2, Clock, Save, RotateCcw, Loader2, RefreshCw, BookOpen,
} from "lucide-react";
import { cn, formatDate, getSurahName } from "@/lib/utils";
import { StudentAvatar } from "@/components/common/student-avatar";
import { HifzJuzGrid } from "@/components/common/hifz-juz-grid";
import { HifzDirection } from "@prisma/client";
import { getHifzCompletionPercent, hifzDirectionLabel } from "@/lib/hifz-progress";

const SABAQ_TYPES = [
  { value: "SABAQ", label: "Sabaq (New Lesson)", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "SABQI", label: "Sabqi (Recent Revision)", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "MANZIL", label: "Manzil (Long-term Revision)", color: "text-purple-600 bg-purple-50 border-purple-200" },
];

type HifzStudent = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender: string;
  currentJuz: number | null;
  currentPara: number | null;
  hifzDirection: HifzDirection | null;
  targetCompletionDate: string | null;
};

type HifzRecordRow = {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  type: string;
  surahNumber: number;
  surahName: string;
  ayahFrom: number;
  ayahTo: number;
  lines: number | null;
  rating: number;
  errorCount: number;
  teacherNote: string | null;
  createdAt: string;
};

const typeColors: Record<string, string> = {
  SABAQ: "pill-success",
  SABQI: "pill-info",
  MANZIL: "pill-primary",
};

const typeLabels: Record<string, string> = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
};

export function HifzContent() {
  const [students, setStudents] = useState<HifzStudent[]>([]);
  const [records, setRecords] = useState<HifzRecordRow[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [activeTab, setActiveTab] = useState<"tracker" | "entry" | "records">("tracker");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avgRating, setAvgRating] = useState(0);

  const [form, setForm] = useState({
    type: "SABAQ",
    surah: "21",
    ayahFrom: "",
    ayahTo: "",
    lines: "",
    rating: 5,
    errorCount: 0,
    note: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (selectedStudent) params.set("studentId", selectedStudent);

      const res = await fetch(`/api/institute/hifz?${params}`);
      if (!res.ok) throw new Error("Failed to load hifz data.");

      const data = await res.json();
      setStudents(data.students || []);
      setRecords(data.records || []);
      setAvgRating(data.quality?.avgRating ?? 0);

      if (!selectedStudent && data.students?.length) {
        setSelectedStudent(data.students[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load hifz data.");
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const student = students.find((s) => s.id === selectedStudent);
  const currentJuz = student?.currentPara ?? student?.currentJuz ?? 0;
  const direction = student?.hifzDirection ?? HifzDirection.REVERSE;
  const completionPct = getHifzCompletionPercent(direction, currentJuz);

  const studentRecords = records.filter((r) => r.studentId === selectedStudent);

  const handleSave = async () => {
    if (!selectedStudent || !form.ayahFrom || !form.ayahTo) {
      setError("Please fill in surah, ayah range, and select a student.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/hifz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          type: form.type,
          surahNumber: form.surah,
          ayahFrom: form.ayahFrom,
          ayahTo: form.ayahTo,
          lines: form.lines,
          rating: form.rating,
          errorCount: form.errorCount,
          teacherNote: form.note,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save record.");
      }

      setSaved(true);
      setForm({ ...form, ayahFrom: "", ayahTo: "", lines: "", note: "" });
      setTimeout(() => setSaved(false), 2000);
      loadData();
      setActiveTab("records");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !students.length) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading hifz students...
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="dash-card p-12 text-center">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-semibold text-gray-900 mb-1">No Hifz students enrolled</h3>
        <p className="text-sm text-gray-500">Enroll students in the Hifz program to start tracking progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Hifz Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} Hifz student{students.length !== 1 ? "s" : ""} from your institute</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-sm py-2" onClick={loadData} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input w-full sm:w-64 max-w-md"
            id="select-student"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">{error}</div>
      )}

      {student && (
        <div className="dash-card p-6 bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-100">
          <div className="flex items-start gap-6">
            <StudentAvatar name={student.fullName} gender={student.gender} photo={student.photo} size="lg" />
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-gray-900">{student.fullName}</h3>
              <p className="text-sm text-gray-500 mb-1">{student.studentId} · Para {currentJuz || 0} / 30</p>
              <p className="text-xs text-gray-400 mb-4">{hifzDirectionLabel(direction)}</p>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400">Progress</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-primary-700">{completionPct}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Avg. Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-gray-900">{avgRating ? avgRating.toFixed(1) : "—"} / 5</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Records</p>
                  <p className="font-bold text-primary-700 mt-1">{studentRecords.length}</p>
                </div>
                {student.targetCompletionDate && (
                  <div>
                    <p className="text-xs text-gray-400">Target Completion</p>
                    <p className="font-bold text-amber-600 mt-1">{formatDate(student.targetCompletionDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "tracker", label: "Juz Progress Map" },
          { key: "entry", label: "Record Lesson" },
          { key: "records", label: "Recent Records" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "tracker" && student && (
        <div className="dash-card p-6">
          <HifzJuzGrid direction={direction} currentJuz={currentJuz} />
          <div className="flex items-center gap-6 text-xs text-gray-500 mt-6">
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-primary-600 inline-block" />Memorised</span>
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-primary-300 inline-block border border-primary-500" />Current para</span>
            <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-md bg-gray-100 inline-block border" />Upcoming</span>
          </div>
        </div>
      )}

      {activeTab === "entry" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Record Today&apos;s Lesson</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Type</label>
              <div className="grid grid-cols-3 gap-3">
                {SABAQ_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={cn(
                      "rounded-xl border-2 p-3 text-sm font-medium transition-all text-left",
                      form.type === t.value ? t.color + " border-current" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Surah</label>
              <select value={form.surah} onChange={(e) => setForm({ ...form, surah: e.target.value })} className="form-input">
                {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}. {getSurahName(n)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lines Covered</label>
              <input type="number" min={1} value={form.lines} onChange={(e) => setForm({ ...form, lines: e.target.value })} placeholder="e.g. 8" className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayah From</label>
              <input type="number" min={1} value={form.ayahFrom} onChange={(e) => setForm({ ...form, ayahFrom: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayah To</label>
              <input type="number" min={1} value={form.ayahTo} onChange={(e) => setForm({ ...form, ayahTo: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })} className="transition-transform hover:scale-110">
                    <Star className={cn("h-8 w-8", r <= form.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200")} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Error Count</label>
              <input type="number" min={0} value={form.errorCount} onChange={(e) => setForm({ ...form, errorCount: +e.target.value })} className="form-input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher Notes</label>
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="form-input resize-none" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> :
                 saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> :
                 <><Save className="h-4 w-4" /> Save Record</>}
              </button>
              <button onClick={() => setForm({ ...form, ayahFrom: "", ayahTo: "", lines: "", note: "" })} className="btn-ghost">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "records" && (
        <div className="dash-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-gray-900">Hifz Records</h3>
            <p className="text-xs text-gray-500 mt-0.5">{records.length} record{records.length !== 1 ? "s" : ""} in database</p>
          </div>
          {records.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">No hifz records yet. Record a lesson to get started.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Surah / Ayahs</th>
                  <th>Lines</th>
                  <th>Rating</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-gray-900">{r.studentName}</td>
                    <td><span className={cn("pill", typeColors[r.type])}>{typeLabels[r.type]}</span></td>
                    <td>
                      <p className="text-gray-700">{r.surahName}</p>
                      <p className="text-xs text-gray-400">{r.surahNumber}:{r.ayahFrom}–{r.ayahTo}</p>
                    </td>
                    <td>{r.lines ?? "—"}</td>
                    <td>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                        ))}
                      </div>
                    </td>
                    <td className="text-gray-400 text-xs">{formatDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
