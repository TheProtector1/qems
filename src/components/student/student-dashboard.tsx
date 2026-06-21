"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, CheckCircle2, Clock, BookOpen, Award, CalendarCheck, Flame } from "lucide-react";

const BADGES: any[] = [];

export function StudentDashboardContent({ initialStudent }: { initialStudent: any }) {
  const [activeTab, setActiveTab] = useState<"today" | "progress" | "badges">("today");

  const JUZ_DATA = Array.from({ length: 30 }, (_, i) => ({
    juz: i + 1,
    completed: initialStudent ? i < initialStudent.currentJuz - 1 : false,
    partial: initialStudent ? i === initialStudent.currentJuz - 1 : false,
  }));

  const TODAY_LESSON: any = null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="dash-card p-6 bg-gradient-to-r from-primary-600 to-emerald-700 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-3xl font-bold">A</span>
          </div>
          <div>
            <p className="text-green-100 text-sm">السَّلَامُ عَلَيْكُمْ</p>
            <h2 className="font-display text-2xl font-bold text-white">{initialStudent?.name || "Student"}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-green-100">
              <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-300" /> {initialStudent?.streak || 0}-day streak</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-300 fill-amber-300" /> {initialStudent?.quality || 0} quality</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> Juz {initialStudent?.currentJuz || 1}/30</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "today", label: "📅 Today's Lesson" },
          { key: "progress", label: "📊 My Progress" },
          { key: "badges", label: "🏆 Achievements" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            id={`tab-student-${t.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "today" && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Today's Schedule</h3>
          {initialStudent?.enrollments?.length > 0 ? (
            initialStudent.enrollments.map((enrollment: any) => {
              const c = enrollment.class;
              return (
                <div key={c.id} className="dash-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.programType} Program</p>
                    </div>
                    {c.meetingLink && (
                      <a
                        href={c.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-xs py-1.5 px-4"
                      >
                        Join Live Class
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">No classes assigned yet.</p>
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">30-Juz Progress</h3>
            <p className="text-xs text-gray-400 mb-4">40% completed</p>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {JUZ_DATA.map((j) => (
                <div
                  key={j.juz}
                  className={cn(
                    "aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                    j.completed ? "bg-gradient-primary text-white" : j.partial ? "bg-gradient-gold text-white animate-pulse-gold" : "bg-gray-100 text-gray-400"
                  )}
                >
                  {j.juz}
                </div>
              ))}
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${initialStudent ? ((initialStudent.currentJuz - 1) / 30) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Accuracy", value: "0%", icon: "🎯", color: "bg-blue-50 text-blue-700" },
              { label: "Fluency", value: "0/10", icon: "🔊", color: "bg-green-50 text-green-700" },
              { label: "Attendance", value: "0%", icon: "📅", color: "bg-purple-50 text-purple-700" },
              { label: "Retention", value: "0%", icon: "🧠", color: "bg-amber-50 text-amber-700" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-2xl p-5", s.color)}>
                <span className="text-2xl">{s.icon}</span>
                <p className="font-display text-3xl font-bold mt-2">{s.value}</p>
                <p className="text-sm opacity-70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "badges" && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Your Achievements</h3>
          <div className="grid grid-cols-3 gap-4">
            {BADGES.map((b, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl p-5 text-center transition-all",
                  b.earned ? "bg-gradient-primary text-white shadow-md" : "bg-gray-100 text-gray-400 opacity-50"
                )}
              >
                <span className="text-4xl block mb-2">{b.icon}</span>
                <p className="text-xs font-semibold">{b.name}</p>
                {!b.earned && <p className="text-xs mt-1 opacity-60">Locked</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
