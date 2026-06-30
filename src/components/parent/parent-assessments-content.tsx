"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

type Result = {
  id: string;
  studentId: string;
  studentName: string;
  exam: string;
  programType: string;
  grade: string;
  score: number;
  isPassed: boolean;
  remarks: string | null;
  date: string;
  examiner: string;
};

type Upcoming = {
  id: string;
  title: string;
  programType: string;
  date: string;
  className?: string;
  examiner: string;
};

type Child = { id: string; fullName: string; studentId: string };

export function ParentAssessmentsContent() {
  const [children, setChildren] = useState<Child[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = selectedChildId ? `?studentId=${selectedChildId}` : "";
    setLoading(true);
    fetch(`/api/parent/assessments${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setChildren(data?.students || []);
        setResults(data?.results || []);
        setUpcoming(data?.upcoming || []);
      })
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  if (loading && results.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading exam results...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary-700" /> Exam Results
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Assessment grades and upcoming exams for your children</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="form-input w-full sm:w-56 h-9 py-1 text-sm"
          >
            <option value="">All children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </select>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary-600" /> Upcoming Assessments
          </h3>
          <div className="space-y-3">
            {upcoming.map((u) => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-border p-4">
                <div>
                  <p className="font-medium text-gray-900">{u.title}</p>
                  <p className="text-xs text-gray-400">{u.programType} • {u.className || "Institute-wide"}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-primary-700">{u.date}</p>
                  <p className="text-xs text-gray-400">{u.examiner}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-gray-900">Published Results</h3>
        </div>
        {results.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-400">No exam results published yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {children.length > 1 && !selectedChildId && <th>Student</th>}
                  <th>Assessment</th>
                  <th>Program</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    {children.length > 1 && !selectedChildId && (
                      <td className="font-medium">{r.studentName}</td>
                    )}
                    <td className="font-medium text-gray-900">{r.exam}</td>
                    <td>{r.programType}</td>
                    <td className="font-semibold">{r.score}%</td>
                    <td>{r.grade}</td>
                    <td>
                      <span className={cn("pill text-[10px] py-0.5", r.isPassed ? "pill-success" : "pill-danger")}>
                        {r.isPassed ? "Passed" : "Needs improvement"}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
