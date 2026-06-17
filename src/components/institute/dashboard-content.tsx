"use client";

import {
  Users, GraduationCap, CalendarCheck, DollarSign,
  TrendingUp, BookOpen, Award, AlertTriangle,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Plus,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";
import Link from "next/link";

// ── Mock Data ──────────────────────────────────────────────
const kpis = [
  {
    label: "Total Students",
    value: "284",
    change: "+12",
    changePct: "+4.4%",
    up: true,
    icon: GraduationCap,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    label: "Attendance Rate",
    value: "94.7%",
    change: "+1.2%",
    changePct: "vs last month",
    up: true,
    icon: CalendarCheck,
    color: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    label: "Hifz Quality Score",
    value: "8.4 / 10",
    change: "+0.3",
    changePct: "vs last month",
    up: true,
    icon: BookOpen,
    color: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    label: "Fee Collection",
    value: "PKR 1.8M",
    change: "-PKR 120K",
    changePct: "outstanding",
    up: false,
    icon: DollarSign,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    label: "Active Teachers",
    value: "18",
    change: "+2",
    changePct: "this month",
    up: true,
    icon: Users,
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
    text: "text-pink-600",
  },
  {
    label: "Completions (YTD)",
    value: "12",
    change: "+5",
    changePct: "vs last year",
    up: true,
    icon: Award,
    color: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50",
    text: "text-teal-600",
  },
];

const attendanceData = [
  { week: "W1", present: 268, absent: 16 },
  { week: "W2", present: 275, absent: 9 },
  { week: "W3", present: 258, absent: 26 },
  { week: "W4", present: 280, absent: 4 },
  { week: "W5", present: 271, absent: 13 },
  { week: "W6", present: 269, absent: 15 },
  { week: "W7", present: 278, absent: 6 },
  { week: "W8", present: 282, absent: 2 },
];

const hifzProgressData = [
  { month: "Jan", sabaq: 420, sabqi: 380, manzil: 310 },
  { month: "Feb", sabaq: 445, sabqi: 400, manzil: 330 },
  { month: "Mar", sabaq: 410, sabqi: 390, manzil: 360 },
  { month: "Apr", sabaq: 465, sabqi: 420, manzil: 380 },
  { month: "May", sabaq: 490, sabqi: 455, manzil: 400 },
  { month: "Jun", sabaq: 510, sabqi: 470, manzil: 420 },
];

const programDistribution = [
  { name: "Hifz", value: 165, color: "#1B5E20" },
  { name: "Nazra", value: 82, color: "#D4AF37" },
  { name: "Tajweed", value: 37, color: "#388E3C" },
];

const recentStudents = [
  { name: "Ahmad Raza Khan", program: "Hifz", juz: 13, quality: 9.2, status: "On Track" },
  { name: "Fatima Noor", program: "Hifz", juz: 8, quality: 8.7, status: "On Track" },
  { name: "Usman Ali", program: "Nazra", juz: null, quality: 7.4, status: "Needs Attention" },
  { name: "Zainab Hassan", program: "Hifz", juz: 22, quality: 9.5, status: "Excellent" },
  { name: "Ibrahim Sheikh", program: "Tajweed", juz: null, quality: 8.1, status: "On Track" },
];

const alerts = [
  { type: "warning", msg: "8 students missed 3+ consecutive days", action: "View Students", href: "/institute/attendance" },
  { type: "danger", msg: "PKR 120,000 in overdue fees", action: "View Dues", href: "/institute/finance/fees" },
  { type: "info", msg: "Quarterly assessment due in 5 days", action: "Schedule Now", href: "/institute/assessments/new" },
];

const COLORS = ["#1B5E20", "#D4AF37", "#388E3C"];

export function InstituteDashboardContent() {
  return (
    <div className="space-y-6">
      {/* ── Greeting ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            السَّلَامُ عَلَيْكُمْ 👋
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Here's what's happening at your institute today
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/institute/students/admissions/new" className="btn-ghost text-sm py-2">
            <Plus className="h-4 w-4" />
            New Admission
          </Link>
          <Link href="/institute/attendance" className="btn-primary text-sm py-2">
            <CalendarCheck className="h-4 w-4" />
            Mark Attendance
          </Link>
        </div>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm border",
                a.type === "warning" && "bg-amber-50 border-amber-200 text-amber-800",
                a.type === "danger" && "bg-red-50 border-red-200 text-red-800",
                a.type === "info" && "bg-blue-50 border-blue-200 text-blue-800"
              )}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{a.msg}</span>
              <Link
                href={a.href}
                className="font-semibold text-xs underline underline-offset-2"
              >
                {a.action}
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    kpi.bg
                  )}
                >
                  <Icon className={cn("h-5 w-5", kpi.text)} />
                </div>
                <button className="text-gray-300 hover:text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
              <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", kpi.up ? "text-green-600" : "text-red-500")}>
                {kpi.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {kpi.change}
                <span className="text-gray-400 font-normal">{kpi.changePct}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Attendance trend */}
        <div className="lg:col-span-2 dash-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Attendance Trend</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 8 weeks</p>
            </div>
            <span className="pill pill-success">94.7% avg</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B5E20" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
              />
              <Area type="monotone" dataKey="present" stroke="#1B5E20" strokeWidth={2.5} fill="url(#presentGrad)" name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#EF4444" strokeWidth={2} fill="none" strokeDasharray="4 2" name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Program distribution */}
        <div className="dash-card p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Program Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">284 total students</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={programDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {programDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {programDistribution.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-600">{p.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hifz Progress Chart ── */}
      <div className="dash-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Hifz Activity Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sabaq, Sabqi & Manzil sessions this year</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {[
              { label: "Sabaq", color: "#1B5E20" },
              { label: "Sabqi", color: "#D4AF37" },
              { label: "Manzil", color: "#81C784" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-gray-500">{l.label}</span>
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hifzProgressData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
            <Bar dataKey="sabaq" fill="#1B5E20" radius={[4, 4, 0, 0]} name="Sabaq" />
            <Bar dataKey="sabqi" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Sabqi" />
            <Bar dataKey="manzil" fill="#81C784" radius={[4, 4, 0, 0]} name="Manzil" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Students</h3>
            <Link href="/institute/students" className="text-xs text-primary-700 font-semibold hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">
                    {s.program}{s.juz ? ` • Juz ${s.juz}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{s.quality}</p>
                  <span
                    className={cn(
                      "pill text-[10px] px-2",
                      s.status === "Excellent" && "pill-success",
                      s.status === "On Track" && "pill-info",
                      s.status === "Needs Attention" && "pill-warning"
                    )}
                  >
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New Student", icon: GraduationCap, href: "/institute/students/new", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { label: "Mark Attendance", icon: CalendarCheck, href: "/institute/attendance", color: "bg-green-50 text-green-700 hover:bg-green-100" },
              { label: "Record Hifz", icon: BookOpen, href: "/institute/quran/hifz/new", color: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
              { label: "Collect Fee", icon: DollarSign, href: "/institute/finance/fees", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
              { label: "New Assessment", icon: TrendingUp, href: "/institute/assessments/new", color: "bg-pink-50 text-pink-700 hover:bg-pink-100" },
              { label: "Send Announcement", icon: AlertTriangle, href: "/institute/communication", color: "bg-teal-50 text-teal-700 hover:bg-teal-100" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.label}
                  href={a.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    a.color
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {a.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
