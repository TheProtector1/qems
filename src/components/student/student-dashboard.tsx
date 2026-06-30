"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Star, BookOpen, Award, CalendarCheck, Flame } from "lucide-react";
import { HifzDirection } from "@prisma/client";
import { buildJuzGrid, getHifzCompletionPercent, hifzDirectionLabel } from "@/lib/hifz-progress";

export function StudentDashboardContent({ initialStudent }: { initialStudent: any }) {
  const [activeTab, setActiveTab] = useState<"today" | "progress" | "badges">("today");

  const direction = (initialStudent?.hifzDirection as HifzDirection) || HifzDirection.REVERSE;
  const currentPara = initialStudent?.currentPara ?? initialStudent?.currentJuz ?? 1;
  const JUZ_DATA = buildJuzGrid(direction, currentPara);
  const completionPct = getHifzCompletionPercent(direction, currentPara);

  const TODAY_LESSON = initialStudent?.todayLesson ?? null;
  const BADGES = initialStudent?.badges ?? [];
  const initials = (initialStudent?.name || "S").split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="dash-card p-6 bg-gradient-to-r from-primary-600 to-emerald-700 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-3xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-green-100 text-sm">السَّلَامُ عَلَيْكُمْ</p>
            <h2 className="font-display text-2xl font-bold text-white">{initialStudent?.name || "Student"}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-green-100">
              <span className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-300" /> {initialStudent?.streak || 0}-day streak</span>
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-300 fill-amber-300" /> {initialStudent?.quality || 0} quality</span>
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> Para {currentPara}/30</span>
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

          {TODAY_LESSON && (
            <div className="dash-card p-5 border-l-4 border-l-primary-500">
              <p className="text-xs font-semibold text-primary-700 uppercase mb-2">Latest Lesson</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="pill pill-success text-[10px] py-0.5">{TODAY_LESSON.type}</span>
                <span className="font-bold text-gray-900">{TODAY_LESSON.surah}</span>
                <span className="text-xs text-gray-400">Ayah {TODAY_LESSON.ayahFrom}–{TODAY_LESSON.ayahTo}</span>
              </div>
              <p className="text-xs text-gray-500">{TODAY_LESSON.date} • Rating {TODAY_LESSON.rating}/5</p>
              {TODAY_LESSON.note && <p className="text-sm text-gray-600 mt-2">{TODAY_LESSON.note}</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === "progress" && (
        <div className="space-y-4">
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-1">30-Para Hifz Progress</h3>
            <p className="text-xs text-gray-400 mb-1">{hifzDirectionLabel(direction)}</p>
            <p className="text-xs text-gray-500 mb-4">{completionPct}% completed</p>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-4">
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
              <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${completionPct}%` }} />
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
          {BADGES.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No badges earned yet. Keep memorising!</p>
          ) : (
          <div className="grid grid-cols-3 gap-4">
            {BADGES.map((b: { icon: string; name: string; date: string; color: string }, i: number) => (
              <div
                key={i}
                className={cn(
                  "rounded-2xl p-5 text-center transition-all bg-gradient-to-br text-white shadow-md",
                  b.color
                )}
              >
                <span className="text-4xl block mb-2">{b.icon}</span>
                <p className="text-xs font-semibold">{b.name}</p>
                <p className="text-[10px] mt-1 opacity-80">{b.date}</p>
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
