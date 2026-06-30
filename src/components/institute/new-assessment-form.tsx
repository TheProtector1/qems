"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save, RotateCcw, CheckCircle2, ArrowLeft, ClipboardList, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TeacherOption = { id: string; name: string };
type ClassOption = { id: string; name: string };

export function NewAssessmentForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    programType: "HIFZ",
    assessmentType: "MONTHLY",
    date: "",
    teacherId: "",
    classId: "",
    maxScore: "100",
    description: "",
  });
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/institute/teachers").then((r) => (r.ok ? r.json() : { teachers: [] })),
      fetch("/api/institute/classes").then((r) => (r.ok ? r.json() : { classes: [] })),
    ])
      .then(([tData, cData]) => {
        setTeachers(
          (tData.teachers || []).map((t: { id: string; user?: { name: string } }) => ({
            id: t.id,
            name: t.user?.name || "Teacher",
          }))
        );
        setClasses(
          (cData.classes || []).map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          }))
        );
      })
      .catch(() => setError("Could not load teachers and classes."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) {
      setError("Title and date are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/assessments/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          programType: form.programType,
          assessmentType: form.assessmentType,
          startDate: form.date,
          teacherId: form.teacherId || undefined,
          classId: form.classId || undefined,
          maxScore: form.maxScore,
          description: form.description,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to schedule assessment");
      }
      setSaved(true);
      setTimeout(() => router.push("/institute/assessments"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading form...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/institute/assessments")}
        className="btn-ghost text-sm py-2 flex items-center gap-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assessments
      </button>

      <div className="dash-card p-8 bg-white">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary-600" />
          Schedule New Assessment
        </h3>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assessment Title</label>
            <input
              type="text"
              placeholder="e.g. Monthly Tajweed Evaluation"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Program Type</label>
            <select
              value={form.programType}
              onChange={(e) => setForm({ ...form, programType: e.target.value })}
              className="form-input"
            >
              <option value="HIFZ">Hifz (Memorization)</option>
              <option value="NAZRA">Nazra (Quran Reading)</option>
              <option value="TAJWEED">Tajweed (Rules & Recitation)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assessment Frequency</label>
            <select
              value={form.assessmentType}
              onChange={(e) => setForm({ ...form, assessmentType: e.target.value })}
              className="form-input"
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Examiner / Teacher</label>
            <select
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              className="form-input"
            >
              <option value="">— Select Examiner —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Class (optional)</label>
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              className="form-input"
            >
              <option value="">— All / Institute-wide —</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date of Assessment</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Maximum Score</label>
            <input
              type="number"
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
              className="form-input"
              min={1}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assessment Criteria / Instructions</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Students will be evaluated on Makhraj correctness, ghunnah rules, and fluency..."
              rows={3}
              className="form-input"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={cn("btn-primary flex-1 justify-center", saved && "bg-green-600")}
          >
            {saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Scheduled!</>
            ) : saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4" /> Schedule Assessment</>
            )}
          </button>
          <button
            onClick={() => setForm({ title: "", programType: "HIFZ", assessmentType: "MONTHLY", date: "", teacherId: "", classId: "", maxScore: "100", description: "" })}
            className="btn-ghost"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
