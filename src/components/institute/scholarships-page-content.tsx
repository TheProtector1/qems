"use client";

import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, Plus, Award, Sparkles, Loader2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type ScholarshipRow = {
  id: string;
  studentName: string;
  studentId: string;
  type: string;
  program: string;
  originalFee: number;
  discountFee: number;
  reason: string;
};

export function ScholarshipsPageContent() {
  const [scholarships, setScholarships] = useState<ScholarshipRow[]>([]);
  const [summary, setSummary] = useState({ monthlySubsidy: 0, scholarshipRatio: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Array<{ id: string; fullName: string; studentId: string; programType: string }>>([]);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantSaving, setGrantSaving] = useState(false);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [grantForm, setGrantForm] = useState({
    studentId: "",
    name: "",
    reason: "",
    startDate: new Date().toISOString().slice(0, 10),
    isFullScholarship: false,
    percentage: "",
    amount: "",
  });

  const loadScholarships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/scholarships");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setScholarships(data.scholarships || []);
      setSummary(data.summary || { monthlySubsidy: 0, scholarshipRatio: 0, activeCount: 0 });
    } catch (err) {
      console.error(err);
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/institute/students?pageSize=50");
      if (!res.ok) return;
      const data = await res.json();
      setStudents(
        (data.students || []).map(
          (student: { id: string; fullName: string; studentId: string; programType: string }) => ({
            id: student.id,
            fullName: student.fullName,
            studentId: student.studentId,
            programType: student.programType,
          })
        )
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    loadScholarships();
    loadStudents();
  }, [loadScholarships, loadStudents]);

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this scholarship grant?")) return;
    const res = await fetch(`/api/institute/scholarships/${id}`, { method: "PATCH" });
    if (res.ok) loadScholarships();
  };

  const openGrantModal = () => {
    setGrantError(null);
    setGrantForm({
      studentId: "",
      name: "",
      reason: "",
      startDate: new Date().toISOString().slice(0, 10),
      isFullScholarship: false,
      percentage: "",
      amount: "",
    });
    setShowGrantModal(true);
  };

  const handleGrantScholarship = async () => {
    setGrantSaving(true);
    setGrantError(null);
    try {
      const res = await fetch("/api/institute/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...grantForm,
          percentage: grantForm.percentage || null,
          amount: grantForm.amount || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to grant scholarship");
      setShowGrantModal(false);
      await loadScholarships();
    } catch (error) {
      setGrantError(error instanceof Error ? error.message : "Failed to grant scholarship");
    } finally {
      setGrantSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading scholarships...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Scholarship Registry</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage discounts, full grants, and sibling deductions</p>
        </div>
        <button type="button" onClick={openGrantModal} className="btn-primary text-sm py-2">
          <Plus className="h-4 w-4" /> Grant Scholarship
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="kpi-card p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-gray-900">{summary.activeCount}</p>
            <p className="text-xs text-gray-500">Active Scholarships</p>
          </div>
        </div>

        <div className="kpi-card p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-gray-900">{formatCurrency(summary.monthlySubsidy)}</p>
            <p className="text-xs text-gray-500">Monthly Subsidy Granted</p>
          </div>
        </div>

        <div className="kpi-card p-5 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-gray-900">{summary.scholarshipRatio}%</p>
            <p className="text-xs text-gray-500">Institution Scholarship Ratio</p>
          </div>
        </div>
      </div>

      <div className="dash-card overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-base">Granted Beneficiaries</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Program</th>
              <th>Discount Type</th>
              <th>Standard Fee</th>
              <th>Discounted Fee</th>
              <th>Reason / Program</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scholarships.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">No active scholarships.</td>
              </tr>
            ) : scholarships.map((s) => (
              <tr key={s.id}>
                <td>
                  <div>
                    <p className="font-semibold text-gray-900">{s.studentName}</p>
                    <p className="text-xs text-gray-400 font-mono">{s.studentId}</p>
                  </div>
                </td>
                <td>{s.program}</td>
                <td>
                  <span className="pill pill-primary text-[10px] py-0.5">{s.type}</span>
                </td>
                <td>{formatCurrency(s.originalFee)}</td>
                <td>
                  <span className="font-bold text-green-700">
                    {s.discountFee === 0 ? "Free Grant" : formatCurrency(s.discountFee)}
                  </span>
                </td>
                <td><span className="text-sm text-gray-500">{s.reason}</span></td>
                <td className="text-right">
                  <button
                    className="btn-ghost text-xs py-1 px-3.5"
                    onClick={() => handleRevoke(s.id)}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !grantSaving && setShowGrantModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-gray-900">Grant Scholarship</h3>
              <button
                type="button"
                onClick={() => !grantSaving && setShowGrantModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student</label>
                <select
                  className="form-input text-sm"
                  value={grantForm.studentId}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, studentId: e.target.value }))}
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.studentId}) - {student.programType}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Scholarship name</label>
                <input
                  className="form-input text-sm"
                  value={grantForm.name}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Merit scholarship"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start date</label>
                <input
                  type="date"
                  className="form-input text-sm"
                  value={grantForm.startDate}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={grantForm.isFullScholarship}
                    onChange={(e) =>
                      setGrantForm((prev) => ({
                        ...prev,
                        isFullScholarship: e.target.checked,
                        percentage: e.target.checked ? "" : prev.percentage,
                        amount: e.target.checked ? "" : prev.amount,
                      }))
                    }
                  />
                  Full scholarship
                </label>
              </div>

              {!grantForm.isFullScholarship && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-input text-sm"
                      value={grantForm.percentage}
                      onChange={(e) => setGrantForm((prev) => ({ ...prev, percentage: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Discount amount</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input text-sm"
                      value={grantForm.amount}
                      onChange={(e) => setGrantForm((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
                <textarea
                  className="form-input text-sm min-h-[90px]"
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why is this scholarship being granted?"
                />
              </div>
            </div>

            {grantError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                {grantError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn-ghost flex-1 text-sm py-2"
                disabled={grantSaving}
                onClick={() => setShowGrantModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center text-sm py-2"
                disabled={grantSaving}
                onClick={handleGrantScholarship}
              >
                {grantSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant scholarship"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
