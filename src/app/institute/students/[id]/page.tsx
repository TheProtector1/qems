import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Star,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  User,
  Heart,
  GraduationCap,
  Clock,
  Award,
  CheckCircle,
  Stethoscope,
  FileText,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, getSurahName } from "@/lib/utils";
import { StudentProfileActions } from "@/components/institute/student-profile-actions";
import { StudentAvatar } from "@/components/common/student-avatar";
import { StudentAuditPanel } from "@/components/institute/student-audit-panel";
import { StudentAttendanceCalendar } from "@/components/institute/student-attendance-calendar";
import { StudentReportsPanel } from "@/components/institute/student-reports-panel";
import { StudentDocumentsManager } from "@/components/institute/student-documents-manager";
import { progressSummaryLabel } from "@/lib/student-progress";
import type { ElementType } from "react";
import { HifzJuzGrid } from "@/components/common/hifz-juz-grid";
import { HifzDirection } from "@prisma/client";
import { getHifzCompletionPercent, hifzDirectionLabel } from "@/lib/hifz-progress";

export const metadata = { title: "Student Profile — QEMS" };

const gradeStyles: Record<string, string> = {
  "A+": "pill-success",
  A: "pill-success",
  "B+": "pill-info",
  B: "pill-info",
  C: "pill-warning",
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

function SectionHeading({
  icon: Icon,
  title,
  action,
}: {
  icon: ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <h3 className="font-display font-bold text-gray-900">{title}</h3>
      </div>
      {action}
    </div>
  );
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
      enrollments: {
        where: { isActive: true },
        include: { class: { select: { id: true, name: true } } },
      },
      hifzRecords: { orderBy: { date: "desc" }, take: 5 },
      user: { select: { isActive: true } },
      alumni: true,
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
  const attendancePresent = attendanceRows.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  const attendancePct = attendanceTotal ? Math.round((attendancePresent / attendanceTotal) * 100) : null;

  const hifzAvg = await prisma.hifzRecord.aggregate({
    where: { studentId: student.id },
    _avg: { rating: true },
  });
  const qualityScore = hifzAvg._avg.rating ? Number((hifzAvg._avg.rating * 2).toFixed(1)) : null;

  const program = programLabel(student.programType);
  const teacherName = student.teacher?.user?.name || "Unassigned";
  const classLabel = student.enrollments?.length
    ? student.enrollments.map((e) => e.class.name).join(", ")
    : "Unassigned";
  const parentName = student.parent?.user?.name || "Parent";
  const parentEmail = student.parent?.user?.email || null;
  const parentPhone = student.parent?.user?.phone || student.emergencyPhone || null;
  const isActive = student.user?.isActive ?? true;
  const hifzDir = student.hifzDirection ?? HifzDirection.REVERSE;
  const currentPara = student.currentPara ?? student.currentJuz;
  const completionPct =
    student.programType === "HIFZ" && currentPara ? getHifzCompletionPercent(hifzDir, currentPara) : 0;
  const showAudit = session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";

  const recentProgress = student.hifzRecords.map((r) => ({
    date: formatDate(r.date),
    type: r.type,
    surah: r.surahName || getSurahName(r.surahNumber),
    ayahs: `${r.ayahFrom}–${r.ayahTo}`,
    grade: ratingToGrade(r.rating),
    notes: r.teacherNote || "—",
  }));

  const backHref =
    session.user.role === "TEACHER"
      ? "/teacher/students"
      : session.user.role === "SUPER_ADMIN"
        ? "/admin/students"
        : "/institute/students";

  const stats = [
    {
      label: "Current Para",
      value: currentPara ? `${currentPara}/30` : "—",
      sub: student.programType === "HIFZ" ? hifzDirectionLabel(hifzDir) : program,
      icon: BookOpen,
      tone: "bg-slate-50 text-slate-600",
    },
    {
      label: "Quality Score",
      value: qualityScore != null ? String(qualityScore) : "—",
      sub: qualityScore != null ? "Out of 10" : "No records yet",
      icon: Star,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Attendance",
      value: attendancePct != null ? `${attendancePct}%` : "—",
      sub: attendanceTotal ? "Last 30 days" : "No records yet",
      icon: CalendarCheck,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Completion",
      value: currentPara ? `${completionPct}%` : "—",
      sub: student.programType === "HIFZ" ? "Hifz progress" : "Program progress",
      icon: TrendingUp,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <DashboardShell
      title="Student Profile"
      breadcrumbs={[{ label: "Students", href: backHref }, { label: student.fullName }]}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to students
        </Link>

        {(student.hifzCompletedAt || student.alumni) && (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="font-display font-bold text-emerald-900">
                  {student.alumni ? "Institute Alumni" : "Hifz Completed — Mabrook!"}
                </p>
                <p className="text-sm text-emerald-800/80 mt-0.5">
                  {student.hifzCompletedAt
                    ? `Completed full Quran memorization on ${formatDate(student.hifzCompletedAt)}`
                    : "Eligible for alumni recognition"}
                </p>
              </div>
            </div>
            {session.user.role === "INSTITUTE_OWNER" && (
              <Link href="/institute/alumni" className="btn-primary text-sm py-2 self-start sm:self-center">
                View alumni roll
              </Link>
            )}
          </div>
        )}

        {/* Profile header */}
        <div className="dash-card bg-white border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <StudentAvatar
                name={student.fullName}
                gender={student.gender}
                photo={student.photo}
                size="xl"
                className="ring-4 ring-gray-100 mx-auto lg:mx-0"
              />

              <div className="flex-1 min-w-0 text-center lg:text-left">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">
                      {student.fullName}
                    </h1>
                    <p className="text-sm font-mono text-gray-500 mt-1">{student.studentId}</p>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mt-3">
                      <span className="pill pill-info text-xs">{program}</span>
                      <span className="pill bg-gray-100 text-gray-700 text-xs">{classLabel}</span>
                      <span
                        className={cn(
                          "pill text-xs",
                          isActive ? "pill-success" : "pill-warning"
                        )}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                      {student.alumni && (
                        <span className="pill pill-success text-xs">Alumni</span>
                      )}
                      {student.hifzCompletedAt && !student.alumni && (
                        <span className="pill bg-emerald-100 text-emerald-800 text-xs">Hifz complete</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center lg:justify-end">
                    <StudentProfileActions
                      studentId={student.id}
                      studentName={student.fullName}
                      studentCode={student.studentId}
                      program={program}
                      progress={progressSummaryLabel(student.programType, student)}
                      teacherName={teacherName}
                      attendanceRate={attendancePct ?? undefined}
                      parentEmail={parentEmail}
                      parentUserId={student.parent?.user?.id ?? null}
                      parentName={parentName}
                      backHref={backHref}
                    />
                  </div>
                </div>

                <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                  {[
                    { label: "Teacher", value: teacherName },
                    { label: "Admitted", value: formatDate(student.admissionDate) },
                    { label: "Date of birth", value: formatDate(student.dateOfBirth) },
                    { label: "Progress", value: progressSummaryLabel(student.programType, student) },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5"
                    >
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        {item.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold text-gray-900 truncate">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="dash-card bg-white p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
              >
                <div
                  className={cn(
                    "h-11 w-11 sm:h-12 sm:w-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                    stat.tone
                  )}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
                  <p className="text-[10px] text-gray-400 truncate">{stat.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Student details */}
        <div className="dash-card bg-white p-5 sm:p-6">
          <SectionHeading icon={User} title="Student details" />
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Blood group", value: student.bloodGroup || "—", icon: Heart },
              { label: "City", value: student.city || "—", icon: MapPin },
              { label: "Country", value: student.country || "PK", icon: MapPin },
              { label: "Address", value: student.address || "—", icon: MapPin },
              { label: "Emergency contact", value: student.emergencyContact || "—", icon: Phone },
              { label: "Emergency phone", value: student.emergencyPhone || "—", icon: Phone },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-2.5">
                  <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 font-medium text-gray-900 break-words">{item.value}</dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>

        {student.programType === "HIFZ" && currentPara && (
          <div className="dash-card p-5 sm:p-6 bg-white">
            <SectionHeading icon={BookOpen} title="Hifz progress map" />
            <HifzJuzGrid direction={hifzDir} currentJuz={currentPara} />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dash-card bg-white overflow-hidden">
            <div className="px-5 sm:px-6 py-5 border-b border-gray-100">
              <SectionHeading
                icon={GraduationCap}
                title="Recent lesson records"
                action={
                  <Link
                    href={`/institute/quran/hifz?student=${student.id}`}
                    className="text-xs text-primary-700 font-semibold hover:underline whitespace-nowrap"
                  >
                    View all →
                  </Link>
                }
              />
            </div>
            {recentProgress.length > 0 ? (
              <div className="overflow-x-auto">
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
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              typeBadge[r.type] || "bg-gray-100 text-gray-600"
                            )}
                          >
                            {r.type}
                          </span>
                        </td>
                        <td className="text-sm text-gray-700">{r.surah}</td>
                        <td className="font-mono text-xs text-gray-500">{r.ayahs}</td>
                        <td>
                          <span className={cn("pill text-[10px]", gradeStyles[r.grade] || "pill-warning")}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="text-xs text-gray-500 max-w-[180px] truncate">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No lesson records yet.</p>
                <Link
                  href={`/institute/quran/hifz?student=${student.id}`}
                  className="inline-block mt-3 text-xs font-semibold text-primary-700 hover:underline"
                >
                  Add first lesson →
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="dash-card p-5 sm:p-6 bg-white">
              <SectionHeading icon={User} title="Parent / guardian" />
              <div className="space-y-3 text-sm">
                {[
                  { icon: User, label: "Name", value: `${parentName} (${student.parent?.relation || "Parent"})` },
                  { icon: Phone, label: "Phone", value: parentPhone || "—" },
                  { icon: Mail, label: "Email", value: parentEmail || "—" },
                  { icon: MapPin, label: "Address", value: student.address || "—" },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                          {f.label}
                        </p>
                        <p className="font-medium text-gray-900 text-xs break-words">{f.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dash-card p-5 sm:p-6 bg-white">
              <SectionHeading icon={Stethoscope} title="Medical notes" />
              {student.medicalNotes ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs text-red-800 leading-relaxed">{student.medicalNotes}</p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <p className="text-xs text-gray-600">No medical concerns on record</p>
                </div>
              )}
            </div>

            <div className="dash-card p-5 sm:p-6 bg-white">
              <SectionHeading icon={Award} title="Prior education" />
              <p className="text-sm text-gray-700 leading-relaxed">
                {student.previousEducation || "Not provided"}
              </p>
            </div>
          </div>
        </div>

        {showAudit && (
          <div className="dash-card bg-white p-5 sm:p-6">
            <StudentAuditPanel studentId={student.id} title="Profile change history" limit={20} />
          </div>
        )}

        <div className="dash-card bg-white p-5 sm:p-6">
          <SectionHeading icon={Calendar} title="Attendance calendar" />
          <StudentAttendanceCalendar
            studentId={student.id}
            compact
            student={{
              id: student.id,
              fullName: student.fullName,
              studentId: student.studentId,
              photo: student.photo,
              gender: student.gender,
              programType: student.programType,
            }}
          />
        </div>

        <div className="dash-card bg-white p-5 sm:p-6">
          <SectionHeading icon={FileText} title="Reports" />
          <StudentReportsPanel
            studentId={student.id}
            studentName={student.fullName}
            program={program}
          />
        </div>

        <div className="dash-card bg-white p-5 sm:p-6">
          <SectionHeading icon={FileText} title="Documents" />
          <StudentDocumentsManager
            studentId={student.id}
            readOnly={session.user.role === "TEACHER"}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
