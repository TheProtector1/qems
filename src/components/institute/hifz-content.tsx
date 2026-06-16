"use client";

import { useState } from "react";
import {
  BookOpen, Plus, Star, TrendingUp, CheckCircle2, Clock,
  ChevronDown, Save, RotateCcw,
} from "lucide-react";
import { cn, getSurahName } from "@/lib/utils";

// 30 Juz with completion state
const JUZ_DATA = Array.from({ length: 30 }, (_, i) => ({
  juz: i + 1,
  completed: i < 12,
  partial: i === 12,
  pages: Math.floor(Math.random() * 5) + 18,
}));

const SABAQ_TYPES = [
  { value: "SABAQ", label: "Sabaq (New Lesson)", color: "text-green-600 bg-green-50 border-green-200" },
  { value: "SABQI", label: "Sabqi (Recent Revision)", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "MANZIL", label: "Manzil (Long-term Revision)", color: "text-purple-600 bg-purple-50 border-purple-200" },
];

const SAMPLE_STUDENTS = [
  { id: "1", name: "Ahmad Raza Khan", juz: 13, quality: 9.2 },
  { id: "2", name: "Fatima Noor", juz: 8, quality: 8.7 },
  { id: "4", name: "Zainab Hassan", juz: 22, quality: 9.5 },
  { id: "7", name: "Hamza Khalid", juz: 17, quality: 8.9 },
];

const RECENT_RECORDS = [
  { student: "Ahmad Raza Khan", type: "SABAQ", surah: "Al-Anbiya", ayahs: "21:45-67", lines: 8, rating: 5, time: "Today 8:30 AM" },
  { student: "Zainab Hassan", type: "MANZIL", surah: "Al-Baqarah", ayahs: "2:1-50", lines: 25, rating: 5, time: "Today 9:00 AM" },
  { student: "Hamza Khalid", type: "SABQI", surah: "Al-Kahf", ayahs: "18:60-82", lines: 12, rating: 4, time: "Today 9:30 AM" },
  { student: "Fatima Noor", type: "SABAQ", surah: "Al-A'raf", ayahs: "7:154-170", lines: 9, rating: 4, time: "Yesterday" },
];

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
  const [selectedStudent, setSelectedStudent] = useState("1");
  const [activeTab, setActiveTab] = useState<"tracker" | "entry" | "records">("tracker");
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

  const student = SAMPLE_STUDENTS.find((s) => s.id === selectedStudent)!;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Hifz Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Track Sabaq, Sabqi & Manzil for each student
          </p>
        </div>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="form-input w-64"
          id="select-student"
        >
          {SAMPLE_STUDENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Student Summary ── */}
      <div className="dash-card p-6 bg-gradient-to-r from-primary-50 to-emerald-50 border-primary-100">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-green">
            <span className="text-white text-xl font-bold font-arabic">ق</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-gray-900">{student.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Hifz Program • Juz {student.juz} / 30</p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Progress</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-40 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                      style={{ width: `${((student.juz - 1) / 30) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-primary-700">
                    {(((student.juz - 1) / 30) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Quality Score</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900">{student.quality} / 10</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Juz Completed</p>
                <p className="font-bold text-primary-700 mt-1">{student.juz - 1} / 30</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Est. Completion</p>
                <p className="font-bold text-amber-600 mt-1">Jun 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "tracker", label: "📊 Juz Progress Map" },
          { key: "entry", label: "✏️ Record Lesson" },
          { key: "records", label: "📋 Recent Records" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            id={`tab-${t.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key
                ? "bg-white text-primary-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Juz Progress Map ── */}
      {activeTab === "tracker" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">30-Juz Progress Map</h3>
          <p className="text-sm text-gray-400 mb-6">Click on any Juz to view details</p>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mb-6">
            {JUZ_DATA.map((j) => (
              <div
                key={j.juz}
                title={`Juz ${j.juz}`}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 group",
                  j.completed
                    ? "bg-gradient-primary text-white shadow-md"
                    : j.partial
                    ? "bg-gradient-gold text-white shadow-md"
                    : "bg-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-700"
                )}
              >
                <span className="text-sm font-bold">{j.juz}</span>
                {j.completed && (
                  <CheckCircle2 className="h-3 w-3 absolute top-1 right-1 opacity-80" />
                )}
                {j.partial && (
                  <Clock className="h-3 w-3 absolute top-1 right-1 opacity-80" />
                )}
                <div className="absolute inset-0 rounded-xl ring-2 ring-primary-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-gradient-primary inline-block" />
              Completed ({student.juz - 1} Juz)
            </span>
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-gradient-gold inline-block" />
              In Progress
            </span>
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-md bg-gray-100 inline-block border" />
              Not Started
            </span>
          </div>

          {/* Weekly Scores */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Accuracy", score: 8.8, color: "text-blue-600 bg-blue-50" },
              { label: "Fluency", score: 8.5, color: "text-green-600 bg-green-50" },
              { label: "Retention", score: 9.1, color: "text-purple-600 bg-purple-50" },
              { label: "Consistency", score: 9.3, color: "text-amber-600 bg-amber-50" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-xl p-4", s.color.split(" ")[1])}>
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={cn("font-display text-2xl font-bold", s.color.split(" ")[0])}>
                  {s.score}
                </p>
                <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-current opacity-60 rounded-full"
                    style={{ width: `${(s.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Record Lesson ── */}
      {activeTab === "entry" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Record Today's Lesson</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Type</label>
              <div className="grid grid-cols-3 gap-3">
                {SABAQ_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, type: t.value })}
                    id={`btn-type-${t.value.toLowerCase()}`}
                    className={cn(
                      "rounded-xl border-2 p-3 text-sm font-medium transition-all text-left",
                      form.type === t.value
                        ? t.color + " border-current"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Surah</label>
              <select
                value={form.surah}
                onChange={(e) => setForm({ ...form, surah: e.target.value })}
                className="form-input"
                id="select-surah"
              >
                {Array.from({ length: 114 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}. {getSurahName(n)}</option>
                ))}
              </select>
            </div>

            {/* Lines */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lines Covered</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.lines}
                onChange={(e) => setForm({ ...form, lines: e.target.value })}
                placeholder="e.g. 8"
                className="form-input"
                id="input-lines"
              />
            </div>

            {/* Ayah range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayah From</label>
              <input
                type="number"
                min={1}
                value={form.ayahFrom}
                onChange={(e) => setForm({ ...form, ayahFrom: e.target.value })}
                placeholder="e.g. 45"
                className="form-input"
                id="input-ayah-from"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ayah To</label>
              <input
                type="number"
                min={1}
                value={form.ayahTo}
                onChange={(e) => setForm({ ...form, ayahTo: e.target.value })}
                placeholder="e.g. 67"
                className="form-input"
                id="input-ayah-to"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teacher Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm({ ...form, rating: r })}
                    id={`btn-rating-${r}`}
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

            {/* Error count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Error Count
              </label>
              <input
                type="number"
                min={0}
                value={form.errorCount}
                onChange={(e) => setForm({ ...form, errorCount: +e.target.value })}
                className="form-input"
                id="input-error-count"
              />
            </div>

            {/* Teacher notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Teacher Notes (optional)
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Any observations or recommendations..."
                rows={3}
                className="form-input resize-none"
                id="input-teacher-note"
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={handleSave}
                id="btn-save-hifz"
                className="btn-primary flex-1 justify-center"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Record
                  </>
                )}
              </button>
              <button
                onClick={() => setForm({ ...form, ayahFrom: "", ayahTo: "", lines: "", note: "" })}
                className="btn-ghost"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Records ── */}
      {activeTab === "records" && (
        <div className="dash-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-gray-900">Recent Hifz Records</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Surah / Ayahs</th>
                <th>Lines</th>
                <th>Rating</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_RECORDS.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium text-gray-900">{r.student}</td>
                  <td>
                    <span className={cn("pill", typeColors[r.type])}>{typeLabels[r.type]}</span>
                  </td>
                  <td>
                    <p className="text-gray-700">{r.surah}</p>
                    <p className="text-xs text-gray-400">{r.ayahs}</p>
                  </td>
                  <td>{r.lines} lines</td>
                  <td>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={cn("h-3.5 w-3.5", s <= r.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                      ))}
                    </div>
                  </td>
                  <td className="text-gray-400 text-xs">{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
