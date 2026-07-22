"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, CheckCircle2, Star, ArrowLeft, Loader2, Clock } from "lucide-react";
import { cn, getSurahName } from "@/lib/utils";

type HifzStudent = { id: string; fullName: string; studentId: string; currentPara?: number | null; currentJuz?: number | null };

const TYPE_LABELS: Record<string, string> = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
};

export function NewHifzForm() {
  const router = useRouter();
  const [students, setStudents] = useState<HifzStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "SABAQ",
    surah: "21",
    ayahFrom: "",
    ayahTo: "",
    lines: "",
    rating: 5,
    errorCount: 0,
    note: "",
    lessonCompleted: null as boolean | null,
    showLessonDetails: false,
  });

  useEffect(() => {
    fetch("/api/institute/hifz")
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        if (data.students?.length) setSelectedStudent(data.students[0].id);
      })
      .catch(() => setError("Failed to load students."))
      .finally(() => setLoading(false));
  }, []);

  const selected = students.find((s) => s.id === selectedStudent);
  const currentPara = selected?.currentPara ?? selected?.currentJuz ?? null;
  const typeLabel = TYPE_LABELS[form.type] || form.type;

  const handleSave = async () => {
    if (!selectedStudent) {
      setError("Please select a student.");
      return;
    }

    const useSimple = !form.showLessonDetails;

    if (useSimple && form.lessonCompleted === null) {
      setError(`Mark ${typeLabel} as Done or Not done.`);
      return;
    }
    if (!useSimple && (!form.ayahFrom || !form.ayahTo)) {
      setError("Please select a student and fill in the ayah range.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = useSimple
        ? {
            studentId: selectedStudent,
            type: form.type,
            simpleLesson: true,
            lessonCompleted: form.lessonCompleted,
            rating: form.rating,
            errorCount: form.errorCount,
            teacherNote: form.note,
          }
        : {
            studentId: selectedStudent,
            type: form.type,
            surahNumber: form.surah,
            ayahFrom: form.ayahFrom,
            ayahTo: form.ayahTo,
            lines: form.lines,
            rating: form.rating,
            errorCount: form.errorCount,
            teacherNote: form.note,
          };

      const res = await fetch("/api/institute/hifz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save.");
      }

      setSaved(true);
      setTimeout(() => router.push("/institute/quran/hifz"), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!students.length) {
    return (
      <div className="max-w-3xl mx-auto dash-card p-12 text-center">
        <p className="text-gray-500 mb-4">No Hifz students enrolled yet.</p>
        <button onClick={() => router.push("/institute/quran/hifz")} className="btn-ghost text-sm py-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push("/institute/quran/hifz")} className="btn-ghost text-sm py-2 flex items-center gap-2 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Hifz Tracking
      </button>

      <div className="dash-card p-8 bg-white">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-6">Record New Hifz Lesson</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">{error}</div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Student</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="form-input">
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Lesson Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "SABAQ", label: "Sabaq (New Lesson)" },
                { value: "SABQI", label: "Sabqi (Recent Rev.)" },
                { value: "MANZIL", label: "Manzil (Long Rev.)" },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      type: t.value,
                      lessonCompleted: null,
                      showLessonDetails: false,
                    })
                  }
                  className={cn(
                    "py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-center",
                    form.type === t.value ? "border-primary-600 bg-primary-50 text-primary-800" : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {!form.showLessonDetails && (
            <div className="md:col-span-2 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">
                  {typeLabel}
                  {form.type !== "SABAQ" && currentPara ? (
                    <span className="text-gray-400 font-normal"> (Para {currentPara})</span>
                  ) : null}
                </p>
                <p className="text-xs text-gray-500 mb-3">Mark Done or Not done. Details are optional.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, lessonCompleted: true })}
                    className={cn(
                      "rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                      form.lessonCompleted === true
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-gray-200 text-gray-500 hover:border-emerald-300"
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1" />
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, lessonCompleted: false })}
                    className={cn(
                      "rounded-xl border-2 py-4 text-sm font-semibold transition-all",
                      form.lessonCompleted === false
                        ? "border-amber-600 bg-amber-50 text-amber-800"
                        : "border-gray-200 text-gray-500 hover:border-amber-300"
                    )}
                  >
                    <Clock className="h-5 w-5 mx-auto mb-1" />
                    Not done
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={form.showLessonDetails}
                  onChange={(e) => setForm({ ...form, showLessonDetails: e.target.checked })}
                />
                Add surah / ayah details
              </label>
            </div>
          )}

          {form.showLessonDetails && (
            <>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={form.showLessonDetails}
                    onChange={(e) =>
                      setForm({ ...form, showLessonDetails: e.target.checked, lessonCompleted: null })
                    }
                  />
                  Add surah / ayah details
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Surah</label>
                <select value={form.surah} onChange={(e) => setForm({ ...form, surah: e.target.value })} className="form-input">
                  {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}. {getSurahName(n)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lines Covered</label>
                <input type="number" min={1} value={form.lines} onChange={(e) => setForm({ ...form, lines: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ayah From</label>
                <input type="number" min={1} value={form.ayahFrom} onChange={(e) => setForm({ ...form, ayahFrom: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ayah To</label>
                <input type="number" min={1} value={form.ayahTo} onChange={(e) => setForm({ ...form, ayahTo: e.target.value })} className="form-input" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teacher Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} type="button" onClick={() => setForm({ ...form, rating: r })} className="transition-transform hover:scale-110">
                  <Star className={cn("h-8 w-8", r <= form.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200")} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Error Count</label>
            <input type="number" min={0} value={form.errorCount} onChange={(e) => setForm({ ...form, errorCount: +e.target.value })} className="form-input" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teacher Notes</label>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="form-input resize-none" />
          </div>
          <div className="md:col-span-2 flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center py-3">
              {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> :
               saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> :
               <><Save className="h-4 w-4" /> Save Hifz Lesson</>}
            </button>
            <button
              onClick={() =>
                setForm({
                  ...form,
                  ayahFrom: "",
                  ayahTo: "",
                  lines: "",
                  note: "",
                  lessonCompleted: null,
                  showLessonDetails: false,
                })
              }
              className="btn-ghost py-3"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
