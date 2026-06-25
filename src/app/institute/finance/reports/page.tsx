"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BarChart3, TrendingUp, DollarSign, Download, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { formatCurrency, downloadCsv } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area
} from "recharts";

type MonthlyReport = {
  month: string;
  revenue: number;
  salaries: number;
  utilities: number;
  profit: number;
};

export default function FinanceReportsPage() {
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  const [summary, setSummary] = useState({
    ytdProfit: 0,
    ytdRevenue: 0,
    ytdExpenses: 0,
    collectionEfficiency: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/finance/reports");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setMonthlyReports(data.monthlyReports || []);
      setSummary(data.summary || { ytdProfit: 0, ytdRevenue: 0, ytdExpenses: 0, collectionEfficiency: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleExport = () => {
    downloadCsv(
      "financial-ledger.csv",
      ["Month", "Revenue", "Salaries", "Utilities", "Profit"],
      monthlyReports.map((r) => [r.month, r.revenue, r.salaries, r.utilities, r.profit])
    );
  };

  if (loading) {
    return (
      <DashboardShell title="Financial Reports" breadcrumbs={[{ label: "Finance", href: "/institute/finance/fees" }, { label: "Reports" }]}>
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading reports...
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Financial Reports"
      breadcrumbs={[
        { label: "Finance", href: "/institute/finance/fees" },
        { label: "Reports" }
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading">Financial Overview & Statements</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track revenue streams, expenses, salaries, and net profit margins</p>
          </div>
          <button className="btn-ghost text-sm py-2" onClick={handleExport} disabled={monthlyReports.length === 0}>
            <Download className="h-4 w-4" /> Export Ledger
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="kpi-card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Net Profit (YTD)</p>
                <p className="font-display text-2xl font-bold text-green-700 mt-1">{formatCurrency(summary.ytdProfit)}</p>
              </div>
              <span className="p-2 bg-green-100 rounded-lg text-green-700">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="kpi-card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Gross Income (YTD)</p>
                <p className="font-display text-2xl font-bold text-blue-700 mt-1">{formatCurrency(summary.ytdRevenue)}</p>
              </div>
              <span className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">{summary.collectionEfficiency}% Collection efficiency</p>
          </div>

          <div className="kpi-card p-5 bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Expenses (YTD)</p>
                <p className="font-display text-2xl font-bold text-red-700 mt-1">{formatCurrency(summary.ytdExpenses)}</p>
              </div>
              <span className="p-2 bg-red-100 rounded-lg text-red-700">
                <ArrowDownRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>

        {monthlyReports.length === 0 ? (
          <div className="dash-card p-12 text-center text-gray-400">
            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No financial data recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-700" /> Monthly Revenue vs Expenses
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyReports}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#1B5E20" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="salaries" fill="#EF4444" name="Salaries" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-700" /> Profit Trend
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyReports}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="profit" stroke="#D4AF37" fill="#D4AF3720" name="Net Profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
