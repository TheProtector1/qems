"use client";

import { useState } from "react";
import {
  BookOpen, Star, Award, TrendingUp, CheckCircle2, Clock, CalendarCheck
} from "lucide-react";
import { cn, getSurahName } from "@/lib/utils";
import { HifzDirection } from "@prisma/client";
import { buildJuzGrid } from "@/lib/hifz-progress";

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
  hifzDirection?: HifzDirection | null;
  hifzCompletionPct?: number;
  qualityScore: number;
  attendancePct: number;
  status: string;
  targetDate: string;
  recentLessons: HifzRecordItem[];
  achievements: { icon: string; name: string; date: string; color: string }[];
  radarMetrics: { subject: string; score: number }[];
};

type ParentQuranProgressProps = {
  childrenData: ChildStudent[];
};

const typeColors: Record<string, string> = {
  SABAQ: "pill-success",
  SABQI: "pill-info",
  MANZIL: "pill-primary",
};

export function ParentQuranProgress({ childrenData }: ParentQuranProgressProps) {
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  if (childrenData.length === 0) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <span className="text-5xl block mb-4">👥</span>
        <h3 className="font-display text-lg font-bold text-gray-900 mb-1">No Child Profiles Linked</h3>
        <p className="text-sm text-gray-500 mb-6">
          Please contact the institute administrator to link your child's profile to your parent account.
        </p>
      </div>
    );
  }

  const child = childrenData[selectedChildIndex];

  return (
    <div className="space-y-6">
      {/* Child selector if parent has multiple children (Privacy preserved: ONLY shows children belonging to this parent account) */}
      {childrenData.length > 1 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Select Child Profile:</label>
          <select
            value={selectedChildIndex}
            onChange={(e) => setSelectedChildIndex(parseInt(e.target.value))}
            className="form-input w-full sm:w-64 max-w-md h-9 py-1 text-xs"
            id="select-parent-child"
          >
            {childrenData.map((c, idx) => (
              <option key={c.id} value={idx}>{c.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Child Overview Summary Card ── */}
      <div className="dash-card p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-emerald-100">
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
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Current Juz</p>
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
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Target Date</p>
              <p className="font-display text-lg font-bold text-gray-700">{child.targetDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Map Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Memorization Progress Map</h3>
          <p className="text-xs text-gray-400 mb-5">Click on a Juz to view completion notes</p>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
            {buildJuzGrid(child.hifzDirection ?? HifzDirection.REVERSE, child.currentJuz).map(({ juz, completed, partial }) => (
                <div
                  key={juz}
                  title={`Para ${juz}`}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center font-bold text-xs border transition-all cursor-default",
                    completed
                      ? "bg-gradient-primary text-white border-primary-600"
                      : partial
                      ? "bg-gradient-gold text-white border-amber-600 ring-2 ring-amber-300"
                      : "bg-gray-50 border-gray-150 text-gray-400"
                  )}
                >
                  <span>{juz}</span>
                  {completed && <CheckCircle2 className="h-3 w-3 mt-1 text-white opacity-80" />}
                  {partial && <Clock className="h-3 w-3 mt-1 text-white opacity-80" />}
                </div>
            ))}
          </div>

          <div className="flex items-center gap-6 text-[10px] text-gray-500 border-t pt-4">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-gradient-primary inline-block" /> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-gradient-gold inline-block" /> In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-gray-50 border inline-block" /> Locked
            </span>
          </div>
        </div>

        {/* Radar metrics */}
        <div className="dash-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Development Breakdown</h3>
            <p className="text-xs text-gray-400 mb-4">Quality and speed consistency ratings</p>
          </div>
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
      </div>

      {/* Recent Lesson Log */}
      <div className="dash-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-gray-900">Recent Lesson Entries</h3>
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
                    <span className={cn("pill text-[9px] py-0.5 px-2 font-bold", typeColors[l.type])}>
                      {l.type}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">{getSurahName(l.surahNumber)}</span>
                    <span className="text-xs text-gray-400">Ayah {l.ayahFrom}–{l.ayahTo}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{l.teacherNote || "No remarks provided."}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn("h-4 w-4", s <= l.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
