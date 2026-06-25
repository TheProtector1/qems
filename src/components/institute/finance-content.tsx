"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Download, Plus, Search, CreditCard, Loader2,
} from "lucide-react";
import { cn, formatCurrency, getInitials, downloadCsv } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type FeeRow = {
  id: string;
  student: string;
  studentId: string;
  program: string;
  month: string;
  amount: number;
  status: string;
  paidAt: string | null;
  method: string | null;
};

const statusConfig: Record<string, { label: string; pill: string; icon: React.ElementType }> = {
  PAID: { label: "Paid", pill: "pill-success", icon: CheckCircle2 },
  PENDING: { label: "Pending", pill: "pill-warning", icon: Clock },
  OVERDUE: { label: "Overdue", pill: "pill-danger", icon: AlertCircle },
  PARTIAL: { label: "Partial", pill: "pill-warning", icon: Clock },
  WAIVED: { label: "Waived", pill: "pill-info", icon: CheckCircle2 },
};

export function FinanceContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [summary, setSummary] = useState<{
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    scholarshipCount: number;
    revenueData: { month: string; collected: number; outstanding: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/fees?summary=true");
      if (!res.ok) throw new Error("Failed to load fees");
      const data = await res.json();
      setFees(data.fees || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
      setFees([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const filtered = fees.filter((f) => {
    const matchSearch =
      f.student.toLowerCase().includes(search.toLowerCase()) ||
      f.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = summary?.totalCollected ?? 0;
  const totalOutstanding = summary?.totalOutstanding ?? 0;
  const collectionRate = summary?.collectionRate ?? 0;
  const revenueData = summary?.revenueData ?? [];
  const scholarshipCount = summary?.scholarshipCount ?? 0;

  const handleExport = () => {
    downloadCsv(
      "fee-records.csv",
      ["Student", "Student ID", "Program", "Month", "Amount", "Status", "Method", "Paid On"],
      filtered.map((f) => [f.student, f.studentId, f.program, f.month, f.amount, f.status, f.method, f.paidAt])
    );
  };

  const handleCollect = async (id: string) => {
    const res = await fetch(`/api/institute/fees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: "CASH" }),
    });
    if (res.ok) loadFees();
  };

  const handleRecordPayment = () => {
    setShowPaymentForm((v) => !v);
    if (!showPaymentForm) {
      document.getElementById("input-search-fees")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading fee records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Fee Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{fees.length} fee record{fees.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm py-2" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="btn-primary text-sm py-2" id="btn-record-payment" onClick={handleRecordPayment}>
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: DollarSign, color: "bg-green-50 text-green-700" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: AlertCircle, color: "bg-red-50 text-red-700" },
          { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "Scholarships", value: `${scholarshipCount} student${scholarshipCount !== 1 ? "s" : ""}`, icon: CreditCard, color: "bg-purple-50 text-purple-700" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="kpi-card p-4 flex items-center gap-3">
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", c.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {revenueData.length > 0 && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Revenue Trend</h3>
          <p className="text-xs text-gray-400 mb-6">Monthly fee collection vs outstanding</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="collected" stroke="#1B5E20" strokeWidth={2.5} dot={{ fill: "#1B5E20", r: 4 }} name="Collected" />
              <Line type="monotone" dataKey="outstanding" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "#EF4444", r: 4 }} name="Outstanding" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="dash-card overflow-hidden">
        <div className="p-5 border-b border-border flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="form-input pl-10"
              id="input-search-fees"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-auto"
            id="select-fee-status"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Program</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Paid On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">No fee records found.</td>
                </tr>
              ) : filtered.map((f) => {
                const cfg = statusConfig[f.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{getInitials(f.student)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm whitespace-nowrap">{f.student}</p>
                          <p className="text-xs text-gray-400 font-mono">{f.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-sm text-gray-600">{f.program}</span></td>
                    <td><span className="text-sm text-gray-600 whitespace-nowrap">{f.month}</span></td>
                    <td>
                      <span className="font-semibold text-gray-900">
                        {f.amount === 0 ? <span className="text-green-600">Scholarship</span> : formatCurrency(f.amount)}
                      </span>
                    </td>
                    <td>
                      <span className={cn("pill", cfg.pill)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td><span className="text-sm text-gray-500">{f.method || "—"}</span></td>
                    <td><span className="text-sm text-gray-500">{f.paidAt || "—"}</span></td>
                    <td>
                      {f.status !== "PAID" && f.status !== "WAIVED" && (
                        <button
                          className="btn-ghost text-xs py-1.5 px-3"
                          id={`btn-collect-${f.id}`}
                          onClick={() => handleCollect(f.id)}
                        >
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
