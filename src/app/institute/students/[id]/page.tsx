import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  ArrowLeft, BookOpen, CalendarCheck, Star, TrendingUp,
  Phone, Mail, MapPin, User, Heart, GraduationCap,
  Clock, Award, CheckCircle, AlertTriangle, Stethoscope,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Student Profile — QEMS" };

// In production this would be fetched from Prisma scoped to the institute
const MOCK_STUDENTS: Record<string, {
  id: string; studentId: string; name: string; gender: string; program: string;
  class: string; section: string; teacher: string; currentJuz: number | null;
  qualityScore: number; attendancePct: number; status: string; admissionDate: string;
  dateOfBirth: string; bloodGroup: string; city: string; address: string;
  parentName: string; parentRelation: string; parentPhone: string; parentEmail: string;
  emergencyContact: string; emergencyPhone: string; medicalNotes: string;
  previousEducation: string; recentProgress: Array<{date: string; type: string; surah: string; ayahs: string; grade: string; notes: string}>;
  attendanceHistory: Array<{month: string; present: number; absent: number; total: number}>;
}> = {
  "1": {
    id: "1", studentId: "STU-2024-0001", name: "Ahmad Raza Khan", gender: "MALE",
    program: "Hifz", class: "Hifz A", section: "Section 1", teacher: "Qari Hamid",
    currentJuz: 13, qualityScore: 9.2, attendancePct: 97, status: "On Track",
    admissionDate: "January 15, 2024", dateOfBirth: "March 8, 2012",
    bloodGroup: "B+", city: "Islamabad", address: "House 45, Street 12, Sector F-7, Islamabad",
    parentName: "Raza Khan", parentRelation: "Father", parentPhone: "0300-1234567", parentEmail: "raza.khan@email.com",
    emergencyContact: "Asma Raza", emergencyPhone: "0321-7654321",
    medicalNotes: "Mild asthma. Carries inhaler. No restrictions on physical activity.",
    previousEducation: "Grade 4 – City Model School",
    recentProgress: [
      { date: "Jun 14", type: "SABAQ", surah: "Al-Kahf", ayahs: "1–20", grade: "A", notes: "Excellent tilawat" },
      { date: "Jun 13", type: "SABQI", surah: "Al-Isra", ayahs: "100–111", grade: "A+", notes: "Completed Surah" },
      { date: "Jun 12", type: "SABAQ", surah: "Al-Isra", ayahs: "78–99", grade: "B+", notes: "Needs tajweed revision" },
      { date: "Jun 11", type: "MANZIL", surah: "Al-Isra", ayahs: "60–77", grade: "A", notes: "Good retention" },
      { date: "Jun 10", type: "SABAQ", surah: "Al-Isra", ayahs: "40–59", grade: "A+", notes: "Superb" },
    ],
    attendanceHistory: [
      { month: "Jan", present: 24, absent: 2, total: 26 },
      { month: "Feb", present: 22, absent: 2, total: 24 },
      { month: "Mar", present: 25, absent: 1, total: 26 },
      { month: "Apr", present: 24, absent: 0, total: 24 },
      { month: "May", present: 26, absent: 0, total: 26 },
      { month: "Jun", present: 14, absent: 0, total: 14 },
    ],
  },
};

const gradeSyles: Record<string, string> = {
  "A+": "pill-success",
  "A": "pill-success",
  "B+": "pill-info",
  "B": "pill-info",
  "C": "pill-warning",
};

const typeBadge: Record<string, string> = {
  SABAQ: "bg-primary-100 text-primary-800",
  SABQI: "bg-blue-100 text-blue-800",
  MANZIL: "bg-amber-100 text-amber-800",
};

const avatarColors = ["from-emerald-400 to-green-600","from-blue-400 to-indigo-600","from-violet-400 to-purple-600"];

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const { id } = await params;

  const s = MOCK_STUDENTS[id] ?? MOCK_STUDENTS["1"];
  const colorIdx = s.name.charCodeAt(0) % avatarColors.length;
  const avatarGrad = s.gender === "FEMALE" ? "from-pink-400 to-rose-600" : avatarColors[colorIdx];
  const completionPct = s.currentJuz ? Math.round((s.currentJuz / 30) * 100) : 0;

  const backHref = session.user.role === "TEACHER"
    ? "/teacher/students"
    : session.user.role === "SUPER_ADMIN"
    ? "/admin/students"
    : "/institute/students";

  return (
    <DashboardShell
      title="Student Profile"
      breadcrumbs={[{ label: "Students", href: backHref }, { label: s.name }]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <Link href={backHref} className="btn-ghost text-sm py-2 inline-flex w-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>

        {/* ── PROFILE HERO CARD ── */}
        <div className="dash-card bg-white overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)" }}
            />
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-5">
              <div className={cn(
                "h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ring-4 ring-white bg-gradient-to-br flex-shrink-0",
                avatarGrad
              )}>
                {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display text-2xl font-bold text-gray-900">{s.name}</h2>
                  <span className={cn("pill", s.status === "Excellent" ? "pill-success" : s.status === "On Track" ? "pill-info" : s.status === "At Risk" ? "pill-danger" : "pill-warning")}>
                    {s.status}
                  </span>
                </div>
                <p className="text-sm font-mono text-primary-700 mt-0.5">{s.studentId}</p>
              </div>
              <div className="flex gap-2 pb-1">
                <button className="btn-ghost text-sm py-2">
                  <MessageSquare className="h-4 w-4" /> Message Parent
                </button>
                <Link href={`/institute/students/${s.id}/edit`} className="btn-primary text-sm py-2">
                  Edit Profile
                </Link>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: "Program", value: s.program, icon: BookOpen },
                { label: "Class", value: s.class, icon: GraduationCap },
                { label: "Section", value: s.section, icon: GraduationCap },
                { label: "Teacher", value: s.teacher, icon: User },
                { label: "Date of Birth", value: s.dateOfBirth, icon: Clock },
                { label: "Blood Group", value: s.bloodGroup, icon: Heart },
                { label: "City", value: s.city, icon: MapPin },
                { label: "Admitted", value: s.admissionDate, icon: CalendarCheck },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Icon className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{f.label}</p>
                      <p className="font-semibold text-gray-900 mt-0.5 text-xs">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── KPI STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Juz", value: s.currentJuz ? `${s.currentJuz}/30` : "N/A", icon: BookOpen, color: "text-green-600 bg-green-50", sub: s.currentJuz ? `${completionPct}% complete` : "Nazra/Tajweed" },
            { label: "Quality Score", value: s.qualityScore.toFixed(1), icon: Star, color: "text-amber-600 bg-amber-50", sub: "Out of 10.0" },
            { label: "Attendance", value: `${s.attendancePct}%`, icon: CalendarCheck, color: s.attendancePct >= 90 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50", sub: "This semester" },
            { label: "Completion", value: s.currentJuz ? `${completionPct}%` : "—", icon: TrendingUp, color: "text-violet-600 bg-violet-50", sub: "Hifz progress" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="kpi-card p-5 flex items-center gap-4">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0", stat.color)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-[10px] text-gray-400">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Hifz Progress Visual ── */}
        {s.currentJuz && (
          <div className="dash-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900">Hifz Map — 30 Juz</h3>
              <span className="pill pill-success">{completionPct}% Complete</span>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <div
                  key={juz}
                  title={`Juz ${juz}${juz <= (s.currentJuz ?? 0) ? " ✓ Memorized" : ""}`}
                  className={cn(
                    "h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                    juz < (s.currentJuz ?? 0)
                      ? "bg-primary-600 text-white shadow-sm"
                      : juz === s.currentJuz
                      ? "bg-primary-300 text-primary-900 ring-2 ring-primary-500 ring-offset-1"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {juz}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-primary-600" /> Memorized</div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-primary-300 ring-1 ring-primary-500" /> Current</div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-gray-100" /> Remaining</div>
            </div>
          </div>
        )}

        {/* ── TWO COLUMN ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Hifz Progress */}
          <div className="lg:col-span-2 dash-card overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-900">Recent Lesson Records</h3>
              <Link href={`/institute/quran/hifz?student=${s.id}`} className="text-xs text-primary-700 font-semibold hover:underline">
                View all →
              </Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Surah</th>
                  <th>Ayahs</th>
                  <th>Grade</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {s.recentProgress.map((r, i) => (
                  <tr key={i}>
                    <td className="text-sm font-medium text-gray-900">{r.date}</td>
                    <td>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", typeBadge[r.type] || "bg-gray-100 text-gray-600")}>
                        {r.type}
                      </span>
                    </td>
                    <td className="text-sm text-gray-700">{r.surah}</td>
                    <td className="font-mono text-xs text-gray-500">{r.ayahs}</td>
                    <td>
                      <span className={cn("pill text-[10px]", gradeSyles[r.grade] || "pill-warning")}>{r.grade}</span>
                    </td>
                    <td className="text-xs text-gray-500">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Parent / Guardian */}
            <div className="dash-card p-5 bg-white">
              <h3 className="font-display font-bold text-gray-900 mb-4">Parent / Guardian</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: User, label: s.parentRelation, value: s.parentName },
                  { icon: Phone, label: "Phone", value: s.parentPhone },
                  { icon: Mail, label: "Email", value: s.parentEmail },
                  { icon: MapPin, label: "Address", value: s.address },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">{f.label}</p>
                        <p className="font-semibold text-gray-900 text-xs">{f.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">Emergency Contact</p>
                <p className="text-xs font-semibold text-gray-800">{s.emergencyContact}</p>
                <p className="text-xs text-gray-500">{s.emergencyPhone}</p>
              </div>
            </div>

            {/* Medical Notes */}
            <div className="dash-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-red-500" />
                <h3 className="font-display font-bold text-gray-900">Medical Notes</h3>
              </div>
              {s.medicalNotes ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-800 leading-relaxed">{s.medicalNotes}</p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-700">No medical concerns on record</p>
                </div>
              )}
            </div>

            {/* Previous Education */}
            <div className="dash-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-primary-600" />
                <h3 className="font-display font-bold text-gray-900">Prior Education</h3>
              </div>
              <p className="text-xs text-gray-700">{s.previousEducation || "Not provided"}</p>
            </div>
          </div>
        </div>

        {/* ── Attendance History ── */}
        <div className="dash-card p-6 bg-white">
          <h3 className="font-display font-bold text-gray-900 mb-5">Attendance History — 2024</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {s.attendanceHistory.map((m) => {
              const pct = Math.round((m.present / m.total) * 100);
              return (
                <div key={m.month} className="text-center p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 mb-2">{m.month}</p>
                  <div className="relative h-16 w-16 mx-auto mb-2">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#dc2626"}
                        strokeWidth="3"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500">{m.present}/{m.total} days</p>
                  {m.absent > 0 && (
                    <p className="text-[9px] text-red-500 mt-0.5">{m.absent} absent</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
