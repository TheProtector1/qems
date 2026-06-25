"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, Plus, Award, Sparkles, Loader2 } from "lucide-react";
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

  useEffect(() => {
    loadScholarships();
  }, [loadScholarships]);

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this scholarship grant?")) return;
    const res = await fetch(`/api/institute/scholarships/${id}`, { method: "PATCH" });
    if (res.ok) loadScholarships();
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
        <Link href="/institute/finance/fees" className="btn-primary text-sm py-2">
          <Plus className="h-4 w-4" /> Grant Scholarship
        </Link>
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
    </div>
  );
}
