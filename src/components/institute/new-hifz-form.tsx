"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, RotateCcw, CheckCircle2, Star, ArrowLeft
} from "lucide-react";
import { cn, getSurahName } from "@/lib/utils";

const SAMPLE_STUDENTS = [
  { id: "1", name: "Ahmad Raza Khan", program: "Hifz" },
  { id: "2", name: "Fatima Noor", program: "Hifz" },
  { id: "4", name: "Zainab Hassan", program: "Hifz" },
  { id: "7", name: "Hamza Khalid", program: "Hifz" },
];

export function NewHifzForm() {
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState("1");
  const [form, setForm] = useState({
    type: "SABAQ",
    surah: "21",
    ayahFrom: "",
    ayahTo: "",
    lines: "",
    rating: 5,
    errorCount: 0,
    fluency: 8,
    note: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/institute/quran/hifz");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/institute/quran/hifz")}
        className="btn-ghost text-sm py-2 flex items-center gap-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Hifz Tracking
      </button>

      {/* Main card */}
      <div className="dash-card p-8 bg-white">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-6">Record New Hifz Lesson</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Select */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="form-input"
            >
              {SAMPLE_STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Lesson Type */}
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
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={cn(
                    "py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-center",
                    form.type === t.value
                      ? "border-primary-600 bg-primary-50 text-primary-800"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surah */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Surah</label>
            <select
              value={form.surah}
              onChange={(e) => setForm({ ...form, surah: e.target.value })}
              className="form-input"
            >
              {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}. {getSurahName(n)}</option>
              ))}
            </select>
          </div>

          {/* Lines Covered */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lines Covered</label>
            <input
              type="number"
              min={1}
              value={form.lines}
              onChange={(e) => setForm({ ...form, lines: e.target.value })}
              placeholder="e.g. 8"
              className="form-input"
            />
          </div>

          {/* Ayah From */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ayah From</label>
            <input
              type="number"
              min={1}
              value={form.ayahFrom}
              onChange={(e) => setForm({ ...form, ayahFrom: e.target.value })}
              placeholder="From verse"
              className="form-input"
            />
          </div>

          {/* Ayah To */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ayah To</label>
            <input
              type="number"
              min={1}
              value={form.ayahTo}
              onChange={(e) => setForm({ ...form, ayahTo: e.target.value })}
              placeholder="To verse"
              className="form-input"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teacher Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, rating: r })}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      r <= form.rating
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-200 fill-gray-200"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Error Count */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Error Count</label>
            <input
              type="number"
              min={0}
              value={form.errorCount}
              onChange={(e) => setForm({ ...form, errorCount: +e.target.value })}
              className="form-input"
            />
          </div>

          {/* Teacher Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teacher Notes (optional)</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Notes on mistakes, retention level, or fluency homework..."
              rows={3}
              className="form-input resize-none"
            />
          </div>

          {/* Save buttons */}
          <div className="md:col-span-2 flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="btn-primary flex-1 justify-center py-3"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Hifz Lesson
                </>
              )}
            </button>
            <button
              onClick={() => setForm({ ...form, ayahFrom: "", ayahTo: "", lines: "", note: "" })}
              className="btn-ghost py-3"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
