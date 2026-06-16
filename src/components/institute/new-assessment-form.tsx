"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save, RotateCcw, CheckCircle2, ArrowLeft, ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NewAssessmentForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    type: "HIFZ",
    date: "",
    examiner: "",
    maxScore: "100",
    description: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/institute/assessments");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/institute/assessments")}
        className="btn-ghost text-sm py-2 flex items-center gap-2 w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Assessments
      </button>

      {/* Main card */}
      <div className="dash-card p-8 bg-white">
        <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary-600" />
          Schedule New Assessment
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Assessment Title */}
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

          {/* Program / Module */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Module / Program Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="form-input"
            >
              <option value="HIFZ">Hifz (Memorization)</option>
              <option value="NAZRA">Nazra (Quran Reading)</option>
              <option value="TAJWEED">Tajweed (Rules & Recitation)</option>
            </select>
          </div>

          {/* Examiner */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Examiner / Teacher</label>
            <select
              value={form.examiner}
              onChange={(e) => setForm({ ...form, examiner: e.target.value })}
              className="form-input"
            >
              <option value="">-- Select Examiner --</option>
              <option value="Qari Hamid">Qari Hamid</option>
              <option value="Qari Imran">Qari Imran</option>
              <option value="Ustaza Rukhsar">Ustaza Rukhsar</option>
              <option value="Qari Bilal">Qari Bilal</option>
            </select>
          </div>

          {/* Assessment Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date of Assessment</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="form-input"
            />
          </div>

          {/* Max Score */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Maximum Marks / Score</label>
            <input
              type="number"
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: e.target.value })}
              className="form-input"
              min={1}
            />
          </div>

          {/* Notes / Description */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Assessment Criteria / Instructions</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Students will be evaluated on Makhraj correctness, ghunnah rules, and fluency..."
              rows={3}
              className="form-input resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="md:col-span-2 flex gap-3 mt-4">
            <button
              onClick={handleSave}
              className="btn-primary flex-1 justify-center py-3"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Scheduled!
                </>
              ) : (
                <>
                  Schedule Assessment
                </>
              )}
            </button>
            <button
              onClick={() => setForm({ title: "", type: "HIFZ", date: "", examiner: "", maxScore: "100", description: "" })}
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
