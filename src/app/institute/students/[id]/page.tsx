import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
<<<<<<< HEAD
import { prisma } from "@/lib/prisma";
=======
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
import { redirect } from "next/navigation";
import {
  ArrowLeft, BookOpen, CalendarCheck, Star, TrendingUp,
  Phone, Mail, MapPin, User, Heart, GraduationCap,
<<<<<<< HEAD
  Clock, Award, CheckCircle, Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getSurahName } from "@/lib/utils";
import { StudentProfileActions } from "@/components/institute/student-profile-actions";

export const metadata = { title: "Student Profile — QEMS" };

const gradeStyles: Record<string, string> = {
=======
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
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
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

<<<<<<< HEAD
const avatarColors = ["from-emerald-400 to-green-600", "from-blue-400 to-indigo-600", "from-violet-400 to-purple-600"];

function programLabel(programType: string) {
  if (programType === "NAZRA") return "Nazra";
  if (programType === "TAJWEED") return "Tajweed";
  return "Hifz";
}

function ratingToGrade(rating: number) {
  if (rating >= 5) return "A+";
  if (rating >= 4) return "A";
  if (rating >= 3) return "B+";
  if (rating >= 2) return "B";
  return "C";
}
=======
const avatarColors = ["from-emerald-400 to-green-600","from-blue-400 to-indigo-600","from-violet-400 to-purple-600"];
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const { id } = await params;

<<<<<<< HEAD
  const student = await prisma.student.findFirst({
    where: {
      id,
      ...(session.user.instituteId ? { instituteId: session.user.instituteId } : {}),
    },
    include: {
      parent: { include: { user: true } },
      teacher: { include: { user: true } },
      hifzRecords: { orderBy: { date: "desc" }, take: 5 },
      user: { select: { isActive: true } },
    },
  });

  if (!student) redirect("/institute/students");

  const program = programLabel(student.programType);
  const teacherName = student.teacher?.user?.name || "Unassigned";
  const parentName = student.parent?.user?.name || "Parent";
  const parentEmail = student.parent?.user?.email || null;
  const status = student.user?.isActive ? "On Track" : "Needs Attention";
  const colorIdx = student.fullName.charCodeAt(0) % avatarColors.length;
  const avatarGrad = student.gender === "FEMALE" ? "from-pink-400 to-rose-600" : avatarColors[colorIdx];
  const completionPct = student.currentJuz ? Math.round((student.currentJuz / 30) * 100) : 0;

  const recentProgress = student.hifzRecords.map((r) => ({
    date: formatDate(r.date),
    type: r.type,
    surah: r.surahName || getSurahName(r.surahNumber),
    ayahs: `${r.ayahFrom}–${r.ayahTo}`,
    grade: ratingToGrade(r.rating),
    notes: r.teacherNote || "—",
  }));
=======
  const s = MOCK_STUDENTS[id] ?? MOCK_STUDENTS["1"];
  const colorIdx = s.name.charCodeAt(0) % avatarColors.length;
  const avatarGrad = s.gender === "FEMALE" ? "from-pink-400 to-rose-600" : avatarColors[colorIdx];
  const completionPct = s.currentJuz ? Math.round((s.currentJuz / 30) * 100) : 0;
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac

  const backHref = session.user.role === "TEACHER"
    ? "/teacher/students"
    : session.user.role === "SUPER_ADMIN"
    ? "/admin/students"
    : "/institute/students";

  return (
    <DashboardShell
      title="Student Profile"
<<<<<<< HEAD
      breadcrumbs={[{ label: "Students", href: backHref }, { label: student.fullName }]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
=======
      breadcrumbs={[{ label: "Students", href: backHref }, { label: s.name }]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
        <Link href={backHref} className="btn-ghost text-sm py-2 inline-flex w-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>

<<<<<<< HEAD
        <div className="dash-card bg-white overflow-hidden">
=======
        {/* ── PROFILE HERO CARD ── */}
        <div className="dash-card bg-white overflow-hidden">
          {/* Banner */}
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
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
<<<<<<< HEAD
                {student.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display text-2xl font-bold text-gray-900">{student.fullName}</h2>
                  <span className={cn("pill", status === "On Track" ? "pill-info" : "pill-warning")}>
                    {status}
                  </span>
                </div>
                <p className="text-sm font-mono text-primary-700 mt-0.5">{student.studentId}</p>
              </div>
              <StudentProfileActions
                studentId={student.id}
                parentEmail={parentEmail}
                backHref={backHref}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                { label: "Program", value: program, icon: BookOpen },
                { label: "Class", value: `${program} Class`, icon: GraduationCap },
                { label: "Section", value: "Section 1", icon: GraduationCap },
                { label: "Teacher", value: teacherName, icon: User },
                { label: "Date of Birth", value: formatDate(student.dateOfBirth), icon: Clock },
                { label: "Blood Group", value: student.bloodGroup || "—", icon: Heart },
                { label: "City", value: student.city || "—", icon: MapPin },
                { label: "Admitted", value: formatDate(student.admissionDate), icon: CalendarCheck },
=======
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
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
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

<<<<<<< HEAD
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Juz", value: student.currentJuz ? `${student.currentJuz}/30` : "N/A", icon: BookOpen, color: "text-green-600 bg-green-50", sub: student.currentJuz ? `${completionPct}% complete` : "Nazra/Tajweed" },
            { label: "Quality Score", value: "8.5", icon: Star, color: "text-amber-600 bg-amber-50", sub: "Out of 10.0" },
            { label: "Attendance", value: "95%", icon: CalendarCheck, color: "text-green-600 bg-green-50", sub: "This semester" },
            { label: "Completion", value: student.currentJuz ? `${completionPct}%` : "—", icon: TrendingUp, color: "text-violet-600 bg-violet-50", sub: "Hifz progress" },
=======
        {/* ── KPI STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Juz", value: s.currentJuz ? `${s.currentJuz}/30` : "N/A", icon: BookOpen, color: "text-green-600 bg-green-50", sub: s.currentJuz ? `${completionPct}% complete` : "Nazra/Tajweed" },
            { label: "Quality Score", value: s.qualityScore.toFixed(1), icon: Star, color: "text-amber-600 bg-amber-50", sub: "Out of 10.0" },
            { label: "Attendance", value: `${s.attendancePct}%`, icon: CalendarCheck, color: s.attendancePct >= 90 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50", sub: "This semester" },
            { label: "Completion", value: s.currentJuz ? `${completionPct}%` : "—", icon: TrendingUp, color: "text-violet-600 bg-violet-50", sub: "Hifz progress" },
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
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

<<<<<<< HEAD
        {student.currentJuz && (
=======
        {/* ── Hifz Progress Visual ── */}
        {s.currentJuz && (
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
          <div className="dash-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900">Hifz Map — 30 Juz</h3>
              <span className="pill pill-success">{completionPct}% Complete</span>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <div
                  key={juz}
<<<<<<< HEAD
                  title={`Juz ${juz}${juz <= (student.currentJuz ?? 0) ? " ✓ Memorized" : ""}`}
                  className={cn(
                    "h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                    juz < (student.currentJuz ?? 0)
                      ? "bg-primary-600 text-white shadow-sm"
                      : juz === student.currentJuz
=======
                  title={`Juz ${juz}${juz <= (s.currentJuz ?? 0) ? " ✓ Memorized" : ""}`}
                  className={cn(
                    "h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                    juz < (s.currentJuz ?? 0)
                      ? "bg-primary-600 text-white shadow-sm"
                      : juz === s.currentJuz
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
                      ? "bg-primary-300 text-primary-900 ring-2 ring-primary-500 ring-offset-1"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {juz}
                </div>
              ))}
            </div>
<<<<<<< HEAD
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dash-card overflow-hidden bg-white">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-900">Recent Lesson Records</h3>
              <Link href={`/institute/quran/hifz?student=${student.id}`} className="text-xs text-primary-700 font-semibold hover:underline">
                View all →
              </Link>
            </div>
            {recentProgress.length > 0 ? (
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
                  {recentProgress.map((r, i) => (
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
                        <span className={cn("pill text-[10px]", gradeStyles[r.grade] || "pill-warning")}>{r.grade}</span>
                      </td>
                      <td className="text-xs text-gray-500">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">No lesson records yet.</div>
            )}
          </div>

          <div className="space-y-6">
=======
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
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
            <div className="dash-card p-5 bg-white">
              <h3 className="font-display font-bold text-gray-900 mb-4">Parent / Guardian</h3>
              <div className="space-y-3 text-sm">
                {[
<<<<<<< HEAD
                  { icon: User, label: student.parent?.relation || "Parent", value: parentName },
                  { icon: Phone, label: "Contact", value: parentEmail || "—" },
                  { icon: Mail, label: "Email", value: parentEmail || "—" },
                  { icon: MapPin, label: "Address", value: student.address || "—" },
=======
                  { icon: User, label: s.parentRelation, value: s.parentName },
                  { icon: Phone, label: "Phone", value: s.parentPhone },
                  { icon: Mail, label: "Email", value: s.parentEmail },
                  { icon: MapPin, label: "Address", value: s.address },
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
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
<<<<<<< HEAD
              {(student.emergencyContact || student.emergencyPhone) && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-1">Emergency Contact</p>
                  <p className="text-xs font-semibold text-gray-800">{student.emergencyContact || "—"}</p>
                  <p className="text-xs text-gray-500">{student.emergencyPhone || "—"}</p>
                </div>
              )}
            </div>

=======
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">Emergency Contact</p>
                <p className="text-xs font-semibold text-gray-800">{s.emergencyContact}</p>
                <p className="text-xs text-gray-500">{s.emergencyPhone}</p>
              </div>
            </div>

            {/* Medical Notes */}
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
            <div className="dash-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-red-500" />
                <h3 className="font-display font-bold text-gray-900">Medical Notes</h3>
              </div>
<<<<<<< HEAD
              {student.medicalNotes ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-800 leading-relaxed">{student.medicalNotes}</p>
=======
              {s.medicalNotes ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-800 leading-relaxed">{s.medicalNotes}</p>
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-700">No medical concerns on record</p>
                </div>
              )}
            </div>

<<<<<<< HEAD
=======
            {/* Previous Education */}
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
            <div className="dash-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-primary-600" />
                <h3 className="font-display font-bold text-gray-900">Prior Education</h3>
              </div>
<<<<<<< HEAD
              <p className="text-xs text-gray-700">{student.previousEducation || "Not provided"}</p>
            </div>
          </div>
        </div>
=======
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
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
      </div>
    </DashboardShell>
  );
}
