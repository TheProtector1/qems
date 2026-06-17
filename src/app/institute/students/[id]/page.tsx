import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ArrowLeft, BookOpen, CalendarCheck, Star, TrendingUp,
  Phone, Mail, MapPin, User, Heart, GraduationCap,
  Clock, Award, CheckCircle, Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getSurahName } from "@/lib/utils";
import { StudentProfileActions } from "@/components/institute/student-profile-actions";
import { StudentAvatar } from "@/components/common/student-avatar";
import { StudentAuditPanel } from "@/components/institute/student-audit-panel";
import { StudentAttendanceCalendar } from "@/components/institute/student-attendance-calendar";
import { StudentReportsPanel } from "@/components/institute/student-reports-panel";
import { progressSummaryLabel } from "@/lib/student-progress";

export const metadata = { title: "Student Profile — QEMS" };

const gradeStyles: Record<string, string> = {
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

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const { id } = await params;

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

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const attendanceRows = await prisma.attendance.findMany({
    where: { studentId: student.id, date: { gte: since } },
    select: { status: true },
  });
  const attendanceTotal = attendanceRows.length;
  const attendancePresent = attendanceRows.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const attendancePct = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : null;

  const hifzAvg = await prisma.hifzRecord.aggregate({
    where: { studentId: student.id },
    _avg: { rating: true },
  });
  const qualityScore = hifzAvg._avg.rating ? Number((hifzAvg._avg.rating * 2).toFixed(1)) : null;

  const program = programLabel(student.programType);
  const teacherName = student.teacher?.user?.name || "Unassigned";
  const parentName = student.parent?.user?.name || "Parent";
  const parentEmail = student.parent?.user?.email || null;
  const status = student.user?.isActive ? "On Track" : "Needs Attention";
  const completionPct = student.currentJuz ? Math.round((student.currentJuz / 30) * 100) : 0;
  const showAudit = session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";

  const recentProgress = student.hifzRecords.map((r) => ({
    date: formatDate(r.date),
    type: r.type,
    surah: r.surahName || getSurahName(r.surahNumber),
    ayahs: `${r.ayahFrom}–${r.ayahTo}`,
    grade: ratingToGrade(r.rating),
    notes: r.teacherNote || "—",
  }));

  const backHref = session.user.role === "TEACHER"
    ? "/teacher/students"
    : session.user.role === "SUPER_ADMIN"
    ? "/admin/students"
    : "/institute/students";

  return (
    <DashboardShell
      title="Student Profile"
      breadcrumbs={[{ label: "Students", href: backHref }, { label: student.fullName }]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <Link href={backHref} className="btn-ghost text-sm py-2 inline-flex w-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>

        <div className="dash-card bg-white overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 relative">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)" }}
            />
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 mb-5">
              <StudentAvatar
                name={student.fullName}
                gender={student.gender}
                photo={student.photo}
                size="lg"
                className="ring-4 ring-white"
              />
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
                { label: "Progress", value: progressSummaryLabel(student.programType, student), icon: BookOpen },
                { label: "Class", value: `${program} Class`, icon: GraduationCap },
                { label: "Section", value: "Section 1", icon: GraduationCap },
                { label: "Teacher", value: teacherName, icon: User },
                { label: "Date of Birth", value: formatDate(student.dateOfBirth), icon: Clock },
                { label: "Blood Group", value: student.bloodGroup || "—", icon: Heart },
                { label: "City", value: student.city || "—", icon: MapPin },
                { label: "Admitted", value: formatDate(student.admissionDate), icon: CalendarCheck },
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Juz", value: student.currentJuz ? `${student.currentJuz}/30` : "N/A", icon: BookOpen, color: "text-green-600 bg-green-50", sub: student.currentJuz ? `${completionPct}% complete` : "Nazra/Tajweed" },
            { label: "Quality Score", value: qualityScore != null ? String(qualityScore) : "—", icon: Star, color: "text-amber-600 bg-amber-50", sub: qualityScore != null ? "Out of 10.0" : "No hifz records" },
            { label: "Attendance", value: attendancePct != null ? `${attendancePct}%` : "—", icon: CalendarCheck, color: "text-green-600 bg-green-50", sub: attendanceTotal ? "Last 30 days" : "No records yet" },
            { label: "Completion", value: student.currentJuz ? `${completionPct}%` : "—", icon: TrendingUp, color: "text-violet-600 bg-violet-50", sub: "Hifz progress" },
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

        {student.currentJuz && (
          <div className="dash-card p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-gray-900">Hifz Map — 30 Juz</h3>
              <span className="pill pill-success">{completionPct}% Complete</span>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
                <div
                  key={juz}
                  title={`Juz ${juz}${juz <= (student.currentJuz ?? 0) ? " ✓ Memorized" : ""}`}
                  className={cn(
                    "h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all",
                    juz < (student.currentJuz ?? 0)
                      ? "bg-primary-600 text-white shadow-sm"
                      : juz === student.currentJuz
                      ? "bg-primary-300 text-primary-900 ring-2 ring-primary-500 ring-offset-1"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {juz}
                </div>
              ))}
            </div>
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
            <div className="dash-card p-5 bg-white">
              <h3 className="font-display font-bold text-gray-900 mb-4">Parent / Guardian</h3>
              <div className="space-y-3 text-sm">
                {[
                  { icon: User, label: student.parent?.relation || "Parent", value: parentName },
                  { icon: Phone, label: "Contact", value: parentEmail || "—" },
                  { icon: Mail, label: "Email", value: parentEmail || "—" },
                  { icon: MapPin, label: "Address", value: student.address || "—" },
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
              {(student.emergencyContact || student.emergencyPhone) && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-1">Emergency Contact</p>
                  <p className="text-xs font-semibold text-gray-800">{student.emergencyContact || "—"}</p>
                  <p className="text-xs text-gray-500">{student.emergencyPhone || "—"}</p>
                </div>
              )}
            </div>

            <div className="dash-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="h-4 w-4 text-red-500" />
                <h3 className="font-display font-bold text-gray-900">Medical Notes</h3>
              </div>
              {student.medicalNotes ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-800 leading-relaxed">{student.medicalNotes}</p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-700">No medical concerns on record</p>
                </div>
              )}
            </div>

            <div className="dash-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4 text-primary-600" />
                <h3 className="font-display font-bold text-gray-900">Prior Education</h3>
              </div>
              <p className="text-xs text-gray-700">{student.previousEducation || "Not provided"}</p>
            </div>
          </div>
        </div>

        {showAudit && (
          <StudentAuditPanel
            studentId={student.id}
            title="Profile Change History"
            limit={20}
          />
        )}

        <StudentAttendanceCalendar studentId={student.id} />

        <StudentReportsPanel
          studentId={student.id}
          studentName={student.fullName}
          program={program}
        />
      </div>
    </DashboardShell>
  );
}
