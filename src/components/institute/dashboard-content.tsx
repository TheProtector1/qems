"use client";

import { useEffect, useState } from "react";
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

const PROGRAM_COLORS: Record<string, string> = {
  HIFZ: "#1B5E20",
  NAZRA: "#D4AF37",
  TAJWEED: "#81C784",
  TARBIYAH: "#7C3AED",
};

type AnalyticsData = {
  kpis: {
    totalStudents: number;
    activeTeachers: number;
    attendanceRate: number;
    qualityScore: number | null;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    hifzCompletions: number;
  };
  attendanceTrend: { week: string; rate: number }[];
  attendanceAvg: number;
  programDistribution: { name: string; value: number; color?: string }[];
  hifzProgressData: { month: string; sabaq: number; sabqi: number; manzil: number }[];
  recentStudents: { id: string; name: string; studentId: string; program: string; admissionDate: string }[];
  alerts: { type: string; message: string; severity: string }[];
};

export function InstituteDashboardContent({
  initialTotalStudents,
  initialActiveTeachers
}: {
  initialTotalStudents: number,
  initialActiveTeachers: number
}) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    fetch("/api/institute/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoadingAnalytics(false));
  }, []);

  const kpi = analytics?.kpis;
  const totalStudents = kpi?.totalStudents ?? initialTotalStudents;
  const activeTeachers = kpi?.activeTeachers ?? initialActiveTeachers;

  const kpis = [
    {
      label: "Total Students",
      value: totalStudents.toString(),
      change: "Active",
      changePct: "",
      up: true,
      icon: GraduationCap,
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Attendance Rate",
      value: loadingAnalytics ? "…" : kpi ? `${kpi.attendanceRate}%` : "N/A",
      change: analytics ? `${analytics.attendanceAvg}%` : "—",
      changePct: "6-wk avg",
      up: (kpi?.attendanceRate ?? 0) >= 75,
      icon: CalendarCheck,
      color: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      label: "Hifz Quality Score",
      value: loadingAnalytics ? "…" : kpi?.qualityScore != null ? `${kpi.qualityScore}/10` : "N/A",
      change: "Live",
      changePct: "from lessons",
      up: true,
      icon: BookOpen,
      color: "from-violet-500 to-purple-600",
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      label: "Fee Collection",
      value: loadingAnalytics ? "…" : kpi ? formatCurrency(kpi.totalCollected) : "N/A",
      change: kpi ? formatCurrency(kpi.totalOutstanding) : "—",
      changePct: "outstanding",
      up: (kpi?.collectionRate ?? 0) >= 70,
      icon: DollarSign,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Active Teachers",
      value: activeTeachers.toString(),
      change: "Active",
      changePct: "",
      up: true,
      icon: Users,
      color: "from-pink-500 to-rose-600",
      bg: "bg-pink-50",
      text: "text-pink-600",
    },
    {
      label: "Completions (YTD)",
      value: loadingAnalytics ? "…" : String(kpi?.hifzCompletions ?? 0),
      change: "Hifz",
      changePct: "completed",
      up: true,
      icon: Award,
      color: "from-teal-500 to-cyan-600",
      bg: "bg-teal-50",
      text: "text-teal-600",
    },
  ];

  const attendanceData = (analytics?.attendanceTrend || []).map((w) => ({
    week: w.week,
    present: w.rate,
    absent: Math.max(0, 100 - w.rate),
  }));
  const hifzProgressData = analytics?.hifzProgressData || [];
  const programDistribution = (analytics?.programDistribution || []).map((p) => ({
    ...p,
    color: p.color || PROGRAM_COLORS[p.name] || "#6B7280",
  }));
  const recentStudents = (analytics?.recentStudents || []).map((s) => ({
    name: s.name,
    program: s.program,
    juz: null,
    quality: "—",
    status: "On Track",
  }));
  const alerts = (analytics?.alerts || []).map((a) => ({
    type: a.severity === "warning" ? "warning" : "info",
    msg: a.message,
    href: a.type === "fee" ? "/institute/finance/fees" : "/institute/attendance",
    action: "View",
  }));

  return (
    <div className="space-y-6">
      {/* ── Greeting ── */}
      <div className="page-header-row">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-gray-900">
            السَّلَامُ عَلَيْكُمْ 👋
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Here's what's happening at your institute today
          </p>
        </div>
        <div className="page-header-actions">
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
            <span className="pill pill-success">
              {analytics?.attendanceAvg ?? kpi?.attendanceRate ?? "—"}% avg
            </span>
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
            <p className="text-xs text-gray-400 mt-0.5">{totalStudents} total students</p>
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
            {recentStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No students yet.</p>
            ) : (
            recentStudents.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {s.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
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
            ))
            )}
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
