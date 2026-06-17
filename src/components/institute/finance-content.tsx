"use client";

import { useState } from "react";
import {
  DollarSign, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Download, Plus, Search, CreditCard, Filter,
} from "lucide-react";
import { cn, formatCurrency, getInitials, downloadCsv } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const FEES = [
  { id: "1", student: "Ahmad Raza Khan", studentId: "STU-2024-0001", program: "Hifz", month: "June 2025", amount: 3500, status: "PAID", paidAt: "2025-06-02", method: "Online" },
  { id: "2", student: "Fatima Noor Hussain", studentId: "STU-2024-0002", program: "Hifz", month: "June 2025", amount: 3500, status: "PAID", paidAt: "2025-06-01", method: "Cash" },
  { id: "3", student: "Usman Ali Siddiqui", studentId: "STU-2024-0003", program: "Nazra", month: "June 2025", amount: 2500, status: "OVERDUE", paidAt: null, method: null },
  { id: "4", student: "Zainab Hassan Malik", studentId: "STU-2024-0004", program: "Hifz", month: "June 2025", amount: 3500, status: "PAID", paidAt: "2025-06-05", method: "JazzCash" },
  { id: "5", student: "Ibrahim Sheikh Rahman", studentId: "STU-2024-0005", program: "Tajweed", month: "June 2025", amount: 2000, status: "PENDING", paidAt: null, method: null },
  { id: "6", student: "Maryam Tariq Butt", studentId: "STU-2024-0006", program: "Hifz", month: "June 2025", amount: 0, status: "PAID", paidAt: "2025-06-03", method: "Scholarship" },
  { id: "7", student: "Hamza Khalid Ansari", studentId: "STU-2024-0007", program: "Hifz", month: "June 2025", amount: 3500, status: "PAID", paidAt: "2025-06-04", method: "Bank Transfer" },
  { id: "8", student: "Sara Ijaz Chaudhry", studentId: "STU-2024-0008", program: "Nazra", month: "June 2025", amount: 2500, status: "OVERDUE", paidAt: null, method: null },
];

const revenueData = [
  { month: "Jan", collected: 380000, outstanding: 45000 },
  { month: "Feb", collected: 395000, outstanding: 38000 },
  { month: "Mar", collected: 420000, outstanding: 52000 },
  { month: "Apr", collected: 410000, outstanding: 41000 },
  { month: "May", collected: 455000, outstanding: 33000 },
  { month: "Jun", collected: 380000, outstanding: 120000 },
];

const statusConfig: Record<string, { label: string; pill: string; icon: React.ElementType }> = {
  PAID: { label: "Paid", pill: "pill-success", icon: CheckCircle2 },
  PENDING: { label: "Pending", pill: "pill-warning", icon: Clock },
  OVERDUE: { label: "Overdue", pill: "pill-danger", icon: AlertCircle },
};

export function FinanceContent() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fees, setFees] = useState(FEES);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const filtered = fees.filter((f) => {
    const matchSearch =
      f.student.toLowerCase().includes(search.toLowerCase()) ||
      f.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = fees.filter((f) => f.status === "PAID").reduce((s, f) => s + f.amount, 0);
  const totalOutstanding = fees.filter((f) => f.status !== "PAID").reduce((s, f) => s + f.amount, 0);
  const collectionRate = Math.round((fees.filter((f) => f.status === "PAID").length / fees.length) * 100);

  const handleExport = () => {
    downloadCsv(
      "fee-records.csv",
      ["Student", "Student ID", "Program", "Month", "Amount", "Status", "Method", "Paid On"],
      filtered.map((f) => [f.student, f.studentId, f.program, f.month, f.amount, f.status, f.method, f.paidAt])
    );
  };

  const handleCollect = (id: string) => {
    setFees((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: "PAID", paidAt: new Date().toISOString().split("T")[0], method: "Cash" }
          : f
      )
    );
  };

  const handleRecordPayment = () => {
    setShowPaymentForm((v) => !v);
    if (!showPaymentForm) {
      document.getElementById("input-search-fees")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Fee Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">June 2025 — {fees.length} students</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm py-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="btn-primary text-sm py-2" id="btn-record-payment" onClick={handleRecordPayment}>
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: DollarSign, color: "bg-green-50 text-green-700" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: AlertCircle, color: "bg-red-50 text-red-700" },
          { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "Scholarships", value: "1 student", icon: CreditCard, color: "bg-purple-50 text-purple-700" },
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

      {/* ── Revenue Chart ── */}
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

      {/* ── Fee Table ── */}
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
              {filtered.map((f) => {
                const cfg = statusConfig[f.status];
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
                      {f.status !== "PAID" && (
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
