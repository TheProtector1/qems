"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen, Plus, Star, TrendingUp, CheckCircle2, Clock,
  ChevronDown, Save, RotateCcw, Award, Play, Loader2
} from "lucide-react";
import { cn, getSurahName } from "@/lib/utils";

type NazraStudent = {
  id: string;
  name: string;
  progress: string;
  qaidaCompleted: boolean;
  readingSpeed: string;
  fluency: number;
};

type NazraRecord = {
  id: string;
  student: string;
  surah: string;
  pageFrom: number;
  pageTo: number;
  fluency: number;
  time: string;
};

const QAIDA_LESSONS = Array.from({ length: 17 }, (_, i) => ({
  lesson: i + 1,
  title: `Lesson ${i + 1}`,
  completed: false,
  active: false,
}));

export function NazraContent() {
  const [students, setStudents] = useState<NazraStudent[]>([]);
  const [records, setRecords] = useState<NazraRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"milestones" | "entry" | "records">("milestones");
  const [form, setForm] = useState({
    mode: "JUZ", // QAIDA or JUZ
    qaidaLesson: "14",
    juzNumber: "2",
    surah: "2",
    ayahFrom: "",
    ayahTo: "",
    errors: 0,
    fluency: "Good",
    notes: "",
  });
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/nazra");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list: NazraStudent[] = data.students || [];
      setStudents(list);
      setRecords(data.records || []);
      if (list.length > 0 && !selectedStudent) setSelectedStudent(list[0].id);
    } catch (err) {
      console.error(err);
      setStudents([]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    loadData();
  }, []);

  const student = students.find((s) => s.id === selectedStudent);

  const handleSave = async () => {
    if (!selectedStudent) return;
    const res = await fetch("/api/institute/nazra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: selectedStudent,
        surahNumber: form.surah,
        pageFrom: form.ayahFrom || form.juzNumber,
        pageTo: form.ayahTo || form.juzNumber,
        fluency: form.fluency === "Excellent" ? 5 : form.fluency === "Good" ? 4 : 3,
        teacherNote: form.notes,
      }),
    });
    if (res.ok) {
      setSaved(true);
      loadData();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading nazra data...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="dash-card p-12 text-center text-gray-400">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No Nazra students enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Nazra Tracking</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Track Quran reading & Qaida progress for foundational students
          </p>
        </div>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="form-input w-full sm:w-64 max-w-md"
          id="select-student"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Student Summary ── */}
      <div className="dash-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-green">
            <span className="text-white text-xl font-bold font-arabic">ن</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-gray-900">{student?.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Nazra Program • Current Status: <strong>{student?.progress}</strong></p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Qaida Status</p>
                <span className={cn(
                  "pill text-xs mt-1 inline-block",
                  student?.qaidaCompleted ? "pill-success" : "pill-warning"
                )}>
                  {student?.qaidaCompleted ? "Completed" : "In Progress"}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Reading Speed</p>
                <p className="font-bold text-gray-900 mt-1">{student?.readingSpeed}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fluency Score</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-gray-900">{student?.fluency?.toFixed(1) ?? "—"} / 10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "milestones", label: "📊 Milestones & Lessons" },
          { key: "entry", label: "✏️ Record Lesson" },
          { key: "records", label: "📋 Recent Progress" },
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

      {/* ── Milestones Map ── */}
      {activeTab === "milestones" && (
        <div className="dash-card p-6">
          {!student?.qaidaCompleted ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Norani Qaida Progress Map</h3>
              <p className="text-sm text-gray-400 mb-6">Foundational reading lesson tracking</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {QAIDA_LESSONS.map((l) => (
                  <div
                    key={l.lesson}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all",
                      l.completed
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : l.active
                        ? "bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-300"
                        : "bg-gray-50 border-gray-100 text-gray-400"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs",
                        l.completed ? "bg-emerald-500 text-white" : l.active ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
                      )}>
                        {l.lesson}
                      </div>
                      <span className="text-sm font-medium">{l.title}</span>
                    </div>
                    {l.completed && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                    {l.active && <Play className="h-4 w-4 text-blue-600 animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Juz Nazra Completion Map</h3>
              <p className="text-sm text-gray-400 mb-6">Quran reading progression</p>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => {
                  const completed = j < 5;
                  const current = j === 5;
                  return (
                    <div
                      key={j}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center font-bold text-sm border transition-all",
                        completed
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : current
                          ? "bg-blue-50 border-blue-200 text-blue-800 ring-2 ring-blue-300"
                          : "bg-gray-50 border-gray-150 text-gray-400"
                      )}
                    >
                      <span>Juz {j}</span>
                      {completed && <CheckCircle2 className="h-3 w-3 mt-1 text-emerald-600" />}
                      {current && <Clock className="h-3 w-3 mt-1 text-blue-600 animate-pulse" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Record Lesson ── */}
      {activeTab === "entry" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Record Reading Lesson</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reading Track</label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="form-input"
                id="select-mode"
              >
                <option value="QAIDA">Norani Qaida</option>
                <option value="JUZ">Juz Reading</option>
              </select>
            </div>

            {form.mode === "QAIDA" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Qaida Lesson</label>
                <select
                  value={form.qaidaLesson}
                  onChange={(e) => setForm({ ...form, qaidaLesson: e.target.value })}
                  className="form-input"
                >
                  {QAIDA_LESSONS.map((l) => (
                    <option key={l.lesson} value={l.lesson}>{l.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Juz Number</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.juzNumber}
                  onChange={(e) => setForm({ ...form, juzNumber: e.target.value })}
                  className="form-input"
                />
              </div>
            )}

            {form.mode === "JUZ" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Surah</label>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Verse From</label>
                    <input
                      type="number"
                      placeholder="From"
                      value={form.ayahFrom}
                      onChange={(e) => setForm({ ...form, ayahFrom: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Verse To</label>
                    <input
                      type="number"
                      placeholder="To"
                      value={form.ayahTo}
                      onChange={(e) => setForm({ ...form, ayahTo: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Error Count</label>
              <input
                type="number"
                min={0}
                value={form.errors}
                onChange={(e) => setForm({ ...form, errors: +e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fluency Level</label>
              <select
                value={form.fluency}
                onChange={(e) => setForm({ ...form, fluency: e.target.value })}
                className="form-input"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Needs Work">Needs Work</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observation / Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Write lesson notes, focus words, or homework rules..."
                rows={3}
                className="form-input resize-none"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                onClick={handleSave}
                className="btn-primary flex-1 justify-center"
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Saved Successfully!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Progress
                  </>
                )}
              </button>
              <button
                onClick={() => setForm({ ...form, ayahFrom: "", ayahTo: "", notes: "" })}
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
            <h3 className="font-semibold text-gray-900">Recent Nazra Entries</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Track / Lesson</th>
                <th>Surah / Verses</th>
                <th>Errors</th>
                <th>Fluency</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">No records yet.</td>
                </tr>
              ) : records.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-900">{r.student}</td>
                  <td>
                    <span className="pill pill-info">Pages {r.pageFrom}-{r.pageTo}</span>
                  </td>
                  <td>
                    <p className="text-gray-700 font-semibold">{r.surah}</p>
                  </td>
                  <td className="font-semibold text-red-600">—</td>
                  <td>
                    <span className="pill pill-info text-[10px]">{r.fluency}/5</span>
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
