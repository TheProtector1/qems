import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, BookOpen, CalendarCheck, Star, ArrowLeft, Phone, Mail, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata = { title: "Student Profile — QEMS" };

const MOCK_STUDENT = {
  id: "1", studentId: "STU-2024-0001", name: "Ahmad Raza Khan", gender: "MALE", program: "Hifz", class: "Hifz A",
  teacher: "Qari Hamid", currentJuz: 13, qualityScore: 9.2, attendancePct: 97, status: "On Track",
  admissionDate: "January 15, 2024", dateOfBirth: "March 8, 2012",
  parentName: "Raza Khan", parentPhone: "0300-1234567", parentEmail: "raza.khan@email.com",
  address: "House 45, Street 12, Sector F-7, Islamabad",
  recentProgress: [
    { date: "June 14", surah: "Al-Kahf", ayahs: "1–20", grade: "A", notes: "Excellent tilawat" },
    { date: "June 13", surah: "Al-Isra", ayahs: "100–111", grade: "A+", notes: "Completed Surah" },
    { date: "June 12", surah: "Al-Isra", ayahs: "78–99", grade: "B+", notes: "Needs tajweed revision" },
    { date: "June 11", surah: "Al-Isra", ayahs: "60–77", grade: "A", notes: "Good memorization" },
  ],
};

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const { id } = await params;

  const s = MOCK_STUDENT;

  return (
    <DashboardShell
      title="Student Profile"
      breadcrumbs={[{ label: "Students", href: "/institute/students" }, { label: s.name }]}
    >
      <div className="space-y-6">
        {/* Back */}
        <Link href="/institute/students" className="btn-ghost text-sm py-2 inline-flex w-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>

        {/* Profile Header */}
        <div className="dash-card p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className={cn(
            "h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0",
            "bg-gradient-primary"
          )}>
            {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display text-2xl font-bold text-gray-900">{s.name}</h2>
              <span className="pill pill-info text-xs">{s.status}</span>
            </div>
            <p className="text-sm font-mono text-primary-700 mb-3">{s.studentId}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
              <div><span className="text-gray-400">Program:</span> <strong>{s.program}</strong></div>
              <div><span className="text-gray-400">Class:</span> <strong>{s.class}</strong></div>
              <div><span className="text-gray-400">Teacher:</span> <strong>{s.teacher}</strong></div>
              <div><span className="text-gray-400">DOB:</span> <strong>{s.dateOfBirth}</strong></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Current Juz", value: `${s.currentJuz}/30`, icon: BookOpen, color: "text-green-600 bg-green-50" },
            { label: "Quality Score", value: s.qualityScore.toFixed(1), icon: Star, color: "text-amber-600 bg-amber-50" },
            { label: "Attendance", value: `${s.attendancePct}%`, icon: CalendarCheck, color: "text-blue-600 bg-blue-50" },
            { label: "Completion", value: `${Math.round((s.currentJuz / 30) * 100)}%`, icon: TrendingUp, color: "text-violet-600 bg-violet-50" },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="kpi-card p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Hifz Progress */}
          <div className="lg:col-span-2 dash-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-display text-base font-bold text-gray-900">Recent Hifz Progress</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Surah</th><th>Ayahs</th><th>Grade</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {s.recentProgress.map((r, i) => (
                  <tr key={i}>
                    <td className="text-sm font-medium text-gray-900">{r.date}</td>
                    <td className="text-sm text-gray-700">{r.surah}</td>
                    <td className="font-mono text-xs text-gray-500">{r.ayahs}</td>
                    <td>
                      <span className={cn(
                        "pill text-[10px]",
                        r.grade.startsWith("A") ? "pill-success" : "pill-warning"
                      )}>{r.grade}</span>
                    </td>
                    <td className="text-xs text-gray-500">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Parent / Contact Info */}
          <div className="dash-card p-5">
            <h3 className="font-display text-base font-bold text-gray-900 mb-4">Parent / Guardian</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div><p className="text-gray-400 text-xs">Father</p><p className="font-semibold text-gray-900">{s.parentName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div><p className="text-gray-400 text-xs">Phone</p><p className="font-semibold text-gray-900">{s.parentPhone}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div><p className="text-gray-400 text-xs">Email</p><p className="font-semibold text-gray-900">{s.parentEmail}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div><p className="text-gray-400 text-xs">Address</p><p className="font-semibold text-gray-900">{s.address}</p></div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Admitted on <strong>{s.admissionDate}</strong></p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
