"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Award, Plus, CheckCircle2, Clock, Calendar, BarChart3, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useShareToChat } from "@/components/common/share-to-chat";
import { buildAssessmentShare } from "@/lib/share-templates";

type Exam = { id: string; name: string; date: string; type: string; status: string; examiner: string };
type Student = { id: string; name: string; class: string };
type Grade = { id: string; student: string; exam: string; type: string; grade: string; score: string; examiner: string; date: string };

export function AssessmentsContent() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "grade" | "history">("upcoming");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [chartData, setChartData] = useState<{ student: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const { share, modal: shareModal } = useShareToChat();

  // Grade Form State
  const [form, setForm] = useState({
    studentId: "",
    examId: "",
    mistakes: 0,
    fluency: 9,
    tajweed: 8,
    remarks: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/assessments");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setExams(data.exams || []);
      setGrades(data.grades || []);
      setStudents(data.students || []);
      setChartData(data.chartData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.examId) return;

    const res = await fetch("/api/institute/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.studentId,
        assessmentId: form.examId,
        mistakeCount: form.mistakes,
        fluency: form.fluency,
        tajweed: form.tajweed,
        remarks: form.remarks,
      }),
    });

    if (res.ok) {
      const student = students.find((s) => s.id === form.studentId);
      const exam = exams.find((e) => e.id === form.examId);
      const scoreTotal = form.fluency + form.tajweed;
      setSaved(true);
      await loadData();
      if (student) {
        share(
          buildAssessmentShare({
            studentName: student.name,
            examTitle: exam?.name,
            score: `${scoreTotal}/20 (fluency ${form.fluency}, tajweed ${form.tajweed}) · mistakes ${form.mistakes}`,
            remarks: form.remarks || undefined,
          }),
          { studentId: student.id }
        );
      }
      setTimeout(() => {
        setSaved(false);
        setForm({ studentId: "", examId: "", mistakes: 0, fluency: 9, tajweed: 8, remarks: "" });
        setActiveTab("history");
      }, 1200);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading assessments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {shareModal}
      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "upcoming", label: "📅 Exams List" },
          { key: "grade", label: "✏️ Enter Grades" },
          { key: "history", label: "📜 Gradebook" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "upcoming" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-900">Upcoming & Recent Assessments</h3>
            <div className="space-y-3">
              {exams.map((ex) => (
                <div key={ex.id} className="dash-card p-5 flex items-center justify-between border-l-4 border-l-primary-600">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{ex.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {ex.date}</span>
                      <span>Examiner: {ex.examiner}</span>
                      <span className="pill pill-primary text-[10px] py-0">{ex.type}</span>
                    </div>
                  </div>
                  <div>
                    {ex.status === "UPCOMING" ? (
                      <span className="pill pill-warning"><Clock className="h-3.5 w-3.5" /> Upcoming</span>
                    ) : (
                      <span className="pill pill-success"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Grade Distribution</h3>
              <p className="text-xs text-gray-400 mb-4">Latest test scores %</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="student" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#1B5E20" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === "grade" && (
        <div className="max-w-2xl mx-auto dash-card p-8">
          <div className="mb-6">
            <h3 className="font-display text-xl font-bold text-gray-900">Enter Assessment Grade</h3>
            <p className="text-xs text-gray-500 mt-1">Grades are calculated dynamically based on total errors and parameters.</p>
          </div>

          <form onSubmit={handleGradeSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="form-input text-xs"
                  required
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Assessment</label>
                <select
                  value={form.examId}
                  onChange={(e) => setForm({ ...form, examId: e.target.value })}
                  className="form-input text-xs"
                  required
                >
                  <option value="">-- Choose Exam --</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mistakes Count</label>
                <input
                  type="number"
                  min={0}
                  value={form.mistakes}
                  onChange={(e) => setForm({ ...form, mistakes: Number(e.target.value) })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fluency (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.fluency}
                  onChange={(e) => setForm({ ...form, fluency: Number(e.target.value) })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tajweed Rules (1-10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.tajweed}
                  onChange={(e) => setForm({ ...form, tajweed: Number(e.target.value) })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Examiner Remarks</label>
              <textarea
                placeholder="Include notes on makharij, gunnah, rules, or areas of improvement..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="form-input h-20 py-2.5 resize-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
                disabled={saved}
              >
                {saved ? "Saving Grade..." : "Submit Grades"}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "history" && (
        <div className="dash-card overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Gradebook Records</h3>
            <span className="pill pill-primary text-[10px] py-0.5">Overall Avg: 87.5%</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assessment / Exam</th>
                  <th>Type</th>
                  <th>Grade</th>
                  <th>Final Score</th>
                  <th>Examiner</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g) => (
                  <tr key={g.id}>
                    <td className="font-semibold text-gray-900">{g.student}</td>
                    <td>{g.exam}</td>
                    <td>
                      <span className="pill pill-info text-[10px] py-0.5">{g.type}</span>
                    </td>
                    <td>
                      <span className={cn(
                        "font-bold text-sm px-2.5 py-0.5 rounded-lg",
                        g.grade.startsWith("A") ? "bg-green-100 text-green-700" :
                        g.grade.startsWith("B") ? "bg-blue-100 text-blue-700" :
                        g.grade.startsWith("C") ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                      )}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="font-bold text-gray-900">{g.score}</td>
                    <td>{g.examiner}</td>
                    <td className="text-gray-400 text-xs">{g.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
