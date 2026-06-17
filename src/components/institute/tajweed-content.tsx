"use client";

import { useState } from "react";
import {
  Award, CheckCircle2, Star, Save, RotateCcw, AlertCircle, Sparkles, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_STUDENTS = [
  { id: "5", name: "Ibrahim Sheikh Rahman", level: "Advanced", makharijScore: 9.0, sifaatScore: 8.5, certificationStatus: "Eligible" },
  { id: "3", name: "Usman Ali Siddiqui", level: "Intermediate", makharijScore: 7.5, sifaatScore: 7.0, certificationStatus: "In Progress" },
];

const TAJWEED_RULES = [
  { id: "r1", rule: "Makharij al-Huroof", category: "Articulation Points", desc: "Correct pronunciation of Arabic letters from their proper source.", weight: "30%" },
  { id: "r2", rule: "Ghunnah (Nasalization)", category: "Rules of Nun & Mim", desc: "Nasal sound produced on Noon and Meem with Tashdeed.", weight: "15%" },
  { id: "r3", rule: "Madd (Prolongation)", category: "Rules of Madd", desc: "Lengthening of vowel sounds under specific conditions.", weight: "20%" },
  { id: "r4", rule: "Qalqalah (Echoing)", category: "Letter Characteristics", desc: "Echoing sound produced on specific letters when Sakin.", weight: "15%" },
  { id: "r5", rule: "Ahkam ar-Raa", category: "Letter Characteristics", desc: "Rules governing the thickness or thinness of the letter Raa.", weight: "10%" },
  { id: "r6", rule: "Waqf (Rules of Stopping)", category: "Recitation Etiquette", desc: "Knowing when and how to pause during recitation.", weight: "10%" },
];

const EVALUATIONS = [
  { student: "Ibrahim Sheikh Rahman", rule: "Madd (Prolongation)", score: 9.5, evaluator: "Qari Hamid", date: "June 14, 2025" },
  { student: "Usman Ali Siddiqui", rule: "Ghunnah (Nasalization)", score: 8.0, evaluator: "Qari Hamid", date: "June 13, 2025" },
];

export function TajweedContent() {
  const [selectedStudent, setSelectedStudent] = useState("5");
  const [activeTab, setActiveTab] = useState<"rules" | "evaluation" | "records">("rules");
  const [form, setForm] = useState({
    ruleId: "r1",
    score: 8,
    comments: "",
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
          <h2 className="section-heading">Tajweed Module</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Evaluate, score, and certify student pronunciation rules (Makharij & Sifaat)
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
      <div className="dash-card p-6 bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-100">
        <div className="flex items-start gap-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-green">
            <span className="text-white text-xl font-bold font-arabic">ت</span>
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-gray-900">{student.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Tajweed Level: <strong>{student.level}</strong></p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-400">Makharij Score</p>
                <div className="flex items-center gap-1 mt-1 font-semibold text-violet-800">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {student.makharijScore} / 10
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Sifaat Score</p>
                <div className="flex items-center gap-1 mt-1 font-semibold text-fuchsia-800">
                  <Star className="h-4 w-4 text-fuchsia-500 fill-fuchsia-500" />
                  {student.sifaatScore} / 10
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">Certification</p>
                <span className={cn(
                  "pill text-xs mt-1 inline-block",
                  student.certificationStatus === "Eligible" ? "pill-success" : "pill-info"
                )}>
                  {student.certificationStatus}
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
            {TAJWEED_RULES.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full">{r.category}</span>
                  <span className="text-xs font-bold text-gray-500">Weight: {r.weight}</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{r.rule}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
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
                {TAJWEED_RULES.map((r) => (
                  <option key={r.id} value={r.id}>{r.rule} ({r.category})</option>
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
              {EVALUATIONS.map((e, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-gray-900">{e.student}</td>
                  <td>
                    <span className="font-medium text-gray-700">{e.rule}</span>
                  </td>
                  <td className="font-bold text-violet-700">{e.score} / 10</td>
                  <td className="text-gray-600">{e.evaluator}</td>
                  <td className="text-gray-400 text-xs">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
