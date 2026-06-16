"use client";

import { useState } from "react";
import {
  BookOpen, CalendarCheck, DollarSign, MessageSquare,
  Star, Award, TrendingUp, CheckCircle2, Bell,
  ChevronRight, Heart,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

const CHILD = {
  name: "Ahmad Raza Khan",
  studentId: "STU-2024-0001",
  program: "Hifz",
  class: "Hifz A",
  teacher: "Qari Hamid",
  currentJuz: 13,
  qualityScore: 9.2,
  attendancePct: 97,
  status: "On Track",
  target: "Jun 2026",
};

const radarData = [
  { subject: "Accuracy", score: 88 },
  { subject: "Fluency", score: 85 },
  { subject: "Retention", score: 91 },
  { subject: "Attendance", score: 97 },
  { subject: "Consistency", score: 93 },
];

const BADGES = [
  { icon: "🏆", name: "First Juz Complete", date: "Feb 2024", color: "from-yellow-400 to-amber-600" },
  { icon: "⭐", name: "Top Student – March", date: "Mar 2024", color: "from-blue-400 to-indigo-600" },
  { icon: "📚", name: "50 Days Attendance", date: "Apr 2024", color: "from-green-400 to-emerald-600" },
  { icon: "🎯", name: "Tajweed Excellence", date: "May 2024", color: "from-purple-400 to-violet-600" },
];

const RECENT_LESSONS = [
  { date: "Jun 15", type: "SABAQ", surah: "Al-Anbiya", ayahs: "21:45–67", rating: 5, note: "Excellent tajweed" },
  { date: "Jun 14", type: "SABQI", surah: "Ta-Ha", ayahs: "20:50–82", rating: 4, note: "Minor error in verse 71" },
  { date: "Jun 13", type: "MANZIL", surah: "Al-Kahf", ayahs: "18:1–50", rating: 5, note: "Very strong retention" },
  { date: "Jun 12", type: "SABAQ", surah: "Maryam", ayahs: "19:83–98", rating: 4, note: "Good pace" },
];

const NOTIFICATIONS = [
  { icon: "📖", msg: "Ahmad scored 5★ on today's Sabaq!", time: "Today 9:00 AM", type: "achievement" },
  { icon: "📅", msg: "Monthly assessment on June 20", time: "2 days ago", type: "info" },
  { icon: "💰", msg: "June fee due on June 25", time: "3 days ago", type: "warning" },
];

const typeColors: Record<string, string> = {
  SABAQ: "pill-success",
  SABQI: "pill-info",
  MANZIL: "pill-primary",
};

export function ParentDashboardContent() {
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "notifications">("overview");

  return (
    <div className="space-y-6">
      {/* ── Child card ── */}
      <div className="dash-card p-6 bg-gradient-to-r from-primary-50 via-emerald-50 to-teal-50 border-primary-100">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-3xl bg-gradient-primary shadow-glow-green flex items-center justify-center flex-shrink-0">
            <span className="text-white text-3xl font-bold">A</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-display text-2xl font-bold text-gray-900">{CHILD.name}</h2>
              <span className="pill pill-success">{CHILD.status}</span>
            </div>
            <p className="text-gray-500 text-sm mb-3">
              {CHILD.program} Program • {CHILD.class} • {CHILD.teacher}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Juz Progress</p>
                <p className="font-bold text-primary-700">{CHILD.currentJuz} / 30</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Quality Score</p>
                <p className="font-bold text-amber-600">⭐ {CHILD.qualityScore}/10</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Attendance</p>
                <p className="font-bold text-green-600">{CHILD.attendancePct}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Est. Completion</p>
                <p className="font-bold text-gray-700">{CHILD.target}</p>
              </div>
            </div>
          </div>
          <Heart className="h-8 w-8 text-rose-400 fill-rose-200 flex-shrink-0 animate-pulse" />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "overview", label: "📊 Overview" },
          { key: "lessons", label: "📖 Lessons" },
          { key: "notifications", label: "🔔 Alerts" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            id={`tab-parent-${t.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar chart */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Performance Profile</h3>
            <p className="text-xs text-gray-400 mb-4">This month's quality metrics</p>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#6B7280" }} />
                <Radar name="Score" dataKey="score" stroke="#1B5E20" fill="#1B5E20" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Juz Map mini */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Memorization Progress</h3>
            <p className="text-xs text-gray-400 mb-4">30 Juz completion map</p>
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {Array.from({ length: 30 }, (_, i) => {
                const juz = i + 1;
                const done = juz < CHILD.currentJuz;
                const partial = juz === CHILD.currentJuz;
                return (
                  <div
                    key={juz}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200",
                      done ? "bg-gradient-primary text-white" : partial ? "bg-gradient-gold text-white" : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {juz}
                  </div>
                );
              })}
            </div>
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Overall Progress</span>
                <span className="font-bold text-primary-700">{(((CHILD.currentJuz - 1) / 30) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${((CHILD.currentJuz - 1) / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">🏆 Achievements & Badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((b, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl p-4 text-white bg-gradient-to-br",
                    b.color
                  )}
                >
                  <span className="text-3xl mb-2 block">{b.icon}</span>
                  <p className="font-semibold text-sm leading-tight">{b.name}</p>
                  <p className="text-xs text-white/70 mt-1">{b.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fee status */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">💰 Fee Status</h3>
            <div className="space-y-3">
              {[
                { month: "June 2025", amount: 3500, status: "DUE", dueDate: "Jun 25" },
                { month: "May 2025", amount: 3500, status: "PAID", paidOn: "May 2" },
                { month: "Apr 2025", amount: 3500, status: "PAID", paidOn: "Apr 1" },
              ].map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{f.month}</p>
                    <p className="text-xs text-gray-400">
                      {f.status === "DUE" ? `Due: ${f.dueDate}` : `Paid: ${(f as any).paidOn}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">{formatCurrency(f.amount)}</span>
                    {f.status === "DUE" ? (
                      <button className="btn-primary text-xs py-1.5 px-3" id="btn-pay-fee">Pay Now</button>
                    ) : (
                      <span className="pill pill-success"><CheckCircle2 className="h-3 w-3" /> Paid</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "lessons" && (
        <div className="dash-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-gray-900">Recent Lessons</h3>
          </div>
          <div className="divide-y divide-border">
            {RECENT_LESSONS.map((l, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <div className="text-right flex-shrink-0 w-12">
                  <p className="text-xs font-medium text-gray-500">{l.date}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("pill text-xs", typeColors[l.type])}>{l.type}</span>
                    <span className="font-medium text-gray-900 text-sm">{l.surah}</span>
                    <span className="text-xs text-gray-400">{l.ayahs}</span>
                  </div>
                  <p className="text-xs text-gray-500">{l.note}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={cn("h-4 w-4", s <= l.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="dash-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-gray-900">Alerts & Notifications</h3>
          </div>
          <div className="divide-y divide-border">
            {NOTIFICATIONS.map((n, i) => (
              <div key={i} className="flex items-start gap-4 px-6 py-4">
                <span className="text-2xl">{n.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.msg}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
                <button className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
