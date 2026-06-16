"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BarChart3, TrendingUp, DollarSign, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area
} from "recharts";

const MONTHLY_REPORTS = [
  { month: "Jan", revenue: 380000, salaries: 180000, utilities: 45000, profit: 155000 },
  { month: "Feb", revenue: 395000, salaries: 180000, utilities: 42000, profit: 173000 },
  { month: "Mar", revenue: 420000, salaries: 195000, utilities: 50000, profit: 175000 },
  { month: "Apr", revenue: 410000, salaries: 195000, utilities: 48000, profit: 167000 },
  { month: "May", revenue: 455000, salaries: 210000, utilities: 52000, profit: 193000 },
  { month: "Jun", revenue: 480000, salaries: 210000, utilities: 55000, profit: 215000 },
];

export default function FinanceReportsPage() {
  return (
    <DashboardShell
      title="Financial Reports"
      breadcrumbs={[
        { label: "Finance", href: "/institute/finance/fees" },
        { label: "Reports" }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading">Financial Overview & Statements</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track revenue streams, expenses, salaries, and net profit margins</p>
          </div>
          <button className="btn-ghost text-sm py-2">
            <Download className="h-4 w-4" /> Export Ledger
          </button>
        </div>

        {/* Top summary grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="kpi-card p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Net Profit (YTD)</p>
                <p className="font-display text-2xl font-bold text-green-700 mt-1">{formatCurrency(1078000)}</p>
              </div>
              <span className="p-2 bg-green-100 rounded-lg text-green-700">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-green-600 mt-3 font-medium">+12.4% vs last semester</p>
          </div>

          <div className="kpi-card p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Gross Income (YTD)</p>
                <p className="font-display text-2xl font-bold text-blue-700 mt-1">{formatCurrency(2540000)}</p>
              </div>
              <span className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <DollarSign className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-3 font-medium">96.8% Collection efficiency</p>
          </div>

          <div className="kpi-card p-5 bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-gray-500">Expenses (YTD)</p>
                <p className="font-display text-2xl font-bold text-red-700 mt-1">{formatCurrency(1462000)}</p>
              </div>
              <span className="p-2 bg-red-100 rounded-lg text-red-700">
                <ArrowDownRight className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-red-600 mt-3 font-medium">Salaries & Utility overheads</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Profit Margins</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Net profit trajectory per month</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MONTHLY_REPORTS}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1B5E20" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="profit" stroke="#1B5E20" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Income vs Expense Breakdown</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">Revenue vs primary overheads</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_REPORTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Revenue" />
                <Bar dataKey="salaries" fill="#EF4444" radius={[3, 3, 0, 0]} name="Staff Salaries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ledger table */}
        <div className="dash-card overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-base">Monthly Statement Summary</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Income</th>
                <th>Staff Salaries</th>
                <th>Utilities / Rent</th>
                <th>Net Monthly Profit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY_REPORTS.map((r, i) => (
                <tr key={i}>
                  <td className="font-bold text-gray-950">{r.month} 2025</td>
                  <td className="text-blue-700 font-semibold">{formatCurrency(r.revenue)}</td>
                  <td className="text-gray-600">{formatCurrency(r.salaries)}</td>
                  <td className="text-gray-600">{formatCurrency(r.utilities)}</td>
                  <td className="text-green-700 font-bold">{formatCurrency(r.profit)}</td>
                  <td>
                    <span className="pill pill-success">Audited</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
