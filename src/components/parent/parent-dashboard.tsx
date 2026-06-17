"use client";

import { useState } from "react";
import {
  BookOpen, CalendarCheck, DollarSign, Star, Award, TrendingUp, CheckCircle2, Heart, ChevronRight
} from "lucide-react";
import { cn, formatCurrency, getSurahName } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────
type HifzRecordItem = {
  date: string;
  type: "SABAQ" | "SABQI" | "MANZIL";
  surahNumber: number;
  ayahFrom: number;
  ayahTo: number;
  rating: number;
  teacherNote?: string | null;
};

type ChildStudent = {
  id: string;
  studentId: string;
  fullName: string;
  programType: string;
  className: string;
  teacherName: string;
  currentJuz: number;
  qualityScore: number;
  attendancePct: number;
  status: string;
  targetDate: string;
  recentLessons: HifzRecordItem[];
  achievements: { icon: string; name: string; date: string; color: string }[];
  radarMetrics: { subject: string; score: number }[];
};

type ParentDashboardContentProps = {
  childrenData: ChildStudent[];
};

const typeColors: Record<string, string> = {
  SABAQ: "pill-success",
  SABQI: "pill-info",
  MANZIL: "pill-primary",
};

const NOTIFICATIONS = [
  { icon: "📖", msg: "Child scored 5★ on today's Sabaq!", time: "Today 9:00 AM", type: "achievement" },
  { icon: "📅", msg: "Monthly assessment scheduled for June 20", time: "2 days ago", type: "info" },
  { icon: "💰", msg: "June academic tuition due on June 25", time: "3 days ago", type: "warning" },
];

export function ParentDashboardContent({ childrenData }: ParentDashboardContentProps) {
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "lessons" | "notifications">("overview");

  if (childrenData.length === 0) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <span className="text-5xl block mb-4">👥</span>
        <h3 className="font-display text-lg font-bold text-gray-900 mb-1">No Associated Profiles</h3>
        <p className="text-sm text-gray-500 mb-6">
          No student profiles are linked to this parent account. Please contact the administrator.
        </p>
      </div>
    );
  }

  const child = childrenData[selectedChildIndex];

  return (
    <div className="space-y-6">
      {/* Selector dropdown to choose between parent's kids (Privacy Preserved: ONLY child records under this parent can be seen) */}
      {childrenData.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Child Profile:</label>
          <select
            value={selectedChildIndex}
            onChange={(e) => setSelectedChildIndex(parseInt(e.target.value))}
            className="form-input w-64 h-9 py-1 text-xs"
            id="select-dashboard-child"
          >
            {childrenData.map((c, idx) => (
              <option key={c.id} value={idx}>{c.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Child card ── */}
      <div className="dash-card p-6 bg-gradient-to-r from-primary-50 via-emerald-50 to-teal-50 border-primary-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {child.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-gray-900">{child.fullName}</h3>
                <span className="pill pill-success text-[10px] py-0.5">{child.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {child.programType} Program • {child.className} • Instructor: {child.teacherName}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Juz Progress</p>
              <p className="font-display text-lg font-bold text-primary-800">{child.currentJuz} / 30</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Quality Rating</p>
              <p className="font-display text-lg font-bold text-amber-700">⭐ {child.qualityScore}/10</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Attendance</p>
              <p className="font-display text-lg font-bold text-green-700">{child.attendancePct}%</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-emerald-100">
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Est. Target</p>
              <p className="font-display text-lg font-bold text-gray-700">{child.targetDate}</p>
            </div>
          </div>
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
          {/* Progress Metrics */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Development Breakdown</h3>
            <p className="text-xs text-gray-400 mb-4">Quality and consistency ratings</p>
            <div className="space-y-4">
              {child.radarMetrics.map((m, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{m.subject}</span>
                    <span>{m.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary rounded-full transition-all"
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Memorization map mini */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Memorization Progress</h3>
            <p className="text-xs text-gray-400 mb-4">30 Juz completion map</p>
            <div className="grid grid-cols-6 gap-1.5 mb-4">
              {Array.from({ length: 30 }, (_, i) => {
                const juz = i + 1;
                const done = juz < child.currentJuz;
                const partial = juz === child.currentJuz;
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
                <span className="font-bold text-primary-700">{(((child.currentJuz - 1) / 30) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-primary rounded-full transition-all"
                  style={{ width: `${((child.currentJuz - 1) / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">🏆 Achievements & Badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {child.achievements.map((b, i) => (
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
            <h3 className="font-semibold text-gray-900 mb-4">💰 Tuition Fee Status</h3>
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
                      {f.status === "DUE" ? `Due: ${f.dueDate}` : `Paid: ${f.paidOn}`}
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
            {child.recentLessons.length === 0 ? (
              <p className="p-6 text-sm text-gray-400 text-center">No Quran lessons logged yet.</p>
            ) : (
              child.recentLessons.map((l, i) => (
                <div key={i} className="flex items-start gap-4 px-6 py-4">
                  <div className="text-right flex-shrink-0 w-16">
                    <p className="text-xs font-semibold text-gray-500">{l.date}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("pill text-[9px] py-0.5 px-2 font-bold", typeColors[l.type])}>{l.type}</span>
                      <span className="font-bold text-gray-900 text-sm">{getSurahName(l.surahNumber)}</span>
                      <span className="text-xs text-gray-400">Ayah {l.ayahFrom}–{l.ayahTo}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{l.teacherNote || "No remarks provided."}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-4 w-4", s <= l.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                    ))}
                  </div>
                </div>
              ))
            )}
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
                <button className="p-1.5 rounded-lg text-gray-300 hover:text-gray-550">
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
