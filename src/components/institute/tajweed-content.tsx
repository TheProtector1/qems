"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Award, CheckCircle2, Star, Save, RotateCcw, AlertCircle, Sparkles, BookOpen, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type TajweedStudent = {
  id: string;
  name: string;
  progress: string;
  masteredCount: number;
  totalRules: number;
  masteryPct: number;
};

type TajweedRule = {
  id: string;
  ruleName: string;
  category: string;
  description: string | null;
};

type Evaluation = {
  id: string;
  studentId: string;
  ruleId: string;
  ruleName: string;
  practiceScore: number | null;
  isMastered: boolean;
};

export function TajweedContent() {
  const [students, setStudents] = useState<TajweedStudent[]>([]);
  const [rules, setRules] = useState<TajweedRule[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rules" | "evaluation" | "records">("rules");
  const [form, setForm] = useState({
    ruleId: "r1",
    score: 8,
    comments: "",
  });
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/tajweed");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list: TajweedStudent[] = data.students || [];
      setStudents(list);
      setRules(data.rules || []);
      setEvaluations(data.evaluations || []);
      if (list.length > 0 && !selectedStudent) setSelectedStudent(list[0].id);
      if ((data.rules || []).length > 0) {
        setForm((f) => ({ ...f, ruleId: data.rules[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    loadData();
  }, []);

  const student = students.find((s) => s.id === selectedStudent);

  const handleSave = async () => {
    if (!selectedStudent || !form.ruleId) return;
    const res = await fetch("/api/institute/tajweed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: selectedStudent,
        ruleId: form.ruleId,
        isMastered: form.score >= 8,
        practiceScore: form.score,
        notes: form.comments,
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
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading tajweed data...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="dash-card p-12 text-center text-gray-400">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No Tajweed students enrolled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Tajweed Module</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Evaluate, score, and certify student pronunciation rules (Makharij & Sifaat)
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
      <div className="dash-card p-6 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-green">
            <span className="text-white text-xl font-bold font-arabic">ت</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-gray-900">{student?.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Progress: <strong>{student?.progress}</strong></p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Rules Mastered</p>
                <div className="flex items-center gap-1 mt-1 font-semibold text-violet-800">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {student?.masteredCount ?? 0} / {student?.totalRules ?? 0}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Mastery</p>
                <div className="flex items-center gap-1 mt-1 font-semibold text-fuchsia-800">
                  <Star className="h-4 w-4 text-fuchsia-500 fill-fuchsia-500" />
                  {student?.masteryPct ?? 0}%
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Certification</p>
                <span className={cn(
                  "pill text-xs mt-1 inline-block",
                  (student?.masteryPct ?? 0) >= 80 ? "pill-success" : "pill-info"
                )}>
                  {(student?.masteryPct ?? 0) >= 80 ? "Eligible" : "In Progress"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "rules", label: "📜 Tajweed Rules & Weight" },
          { key: "evaluation", label: "✏️ Evaluate Rule" },
          { key: "records", label: "📋 Evaluation History" },
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

      {/* ── Rules List ── */}
      {activeTab === "rules" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Standard Tajweed Curriculum Rules</h3>
          <p className="text-sm text-gray-400 mb-6">Foundational recitation rubrics and grading weightage</p>
          <div className="grid md:grid-cols-2 gap-4">
            {rules.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No tajweed rules in database yet.</p>
            ) : rules.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full">{r.category}</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{r.ruleName}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{r.description || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Evaluate Rule ── */}
      {activeTab === "evaluation" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Submit Recitation Evaluation</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rule Assessed</label>
              <select
                value={form.ruleId}
                onChange={(e) => setForm({ ...form, ruleId: e.target.value })}
                className="form-input"
              >
                {rules.map((r) => (
                  <option key={r.id} value={r.id}>{r.ruleName} ({r.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Score (Out of 10)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, score: s })}
                    className={cn(
                      "h-8 w-8 rounded-lg font-bold text-xs border transition-all",
                      form.score === s
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Detailed Performance Comments</label>
              <textarea
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="Identify exact mistakes, letters mispronounced, or specific rules applied correctly..."
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
                    Save Evaluation
                  </>
                )}
              </button>
              <button
                onClick={() => setForm({ ...form, comments: "" })}
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
            <h3 className="font-semibold text-gray-900">Tajweed Evaluation History</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Rule</th>
                <th>Score</th>
                <th>Assessed By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">No evaluations yet.</td>
                </tr>
              ) : evaluations
                .filter((e) => !selectedStudent || e.studentId === selectedStudent)
                .map((e) => {
                  const s = students.find((st) => st.id === e.studentId);
                  return (
                    <tr key={e.id}>
                      <td className="font-semibold text-gray-900">{s?.name || "—"}</td>
                      <td>
                        <span className="font-medium text-gray-700">{e.ruleName}</span>
                      </td>
                      <td className="font-bold text-violet-700">{e.practiceScore ?? "—"} / 10</td>
                      <td className="text-gray-600">{e.isMastered ? "Mastered" : "In progress"}</td>
                      <td className="text-gray-400 text-xs">—</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
