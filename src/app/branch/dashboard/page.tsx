import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { getBranchDashboardStats, getBranchManagerContext } from "@/lib/branch-portal-data";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, GraduationCap, CalendarCheck, DollarSign, GitBranch } from "lucide-react";

export const metadata = { title: "Branch Dashboard - QEMS" };

export default async function BranchDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const ctx = await getBranchManagerContext(session.user.id);
  if (!ctx) {
    return (
      <DashboardShell title="Branch Dashboard" breadcrumbs={[{ label: "Branch" }]}>
        <div className="dash-card p-12 text-center max-w-lg mx-auto">
          <GitBranch className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <h3 className="font-semibold text-gray-900 mb-1">No branch assigned</h3>
          <p className="text-sm text-gray-500">
            Your account is not linked to a branch. Contact the institute owner.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const stats = await getBranchDashboardStats(ctx.branchId);

  const kpis = [
    { label: "Students", value: stats.students, icon: GraduationCap, color: "text-blue-600 bg-blue-50" },
    { label: "Teachers", value: stats.teachers, icon: Users, color: "text-pink-600 bg-pink-50" },
    { label: "Classes", value: stats.classes, icon: GitBranch, color: "text-violet-600 bg-violet-50" },
    { label: "Attendance (30d)", value: `${stats.attendanceRate}%`, icon: CalendarCheck, color: "text-green-600 bg-green-50" },
  ];

  return (
    <DashboardShell
      title={ctx.branchName}
      breadcrumbs={[{ label: ctx.instituteName }, { label: "Branch Dashboard" }]}
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">{ctx.branchName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">Branch operations overview</p>
        </div>

        {stats.overdueFees > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {stats.overdueFees} overdue fee invoice(s) at this branch.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="dash-card p-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${k.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display text-xl font-bold text-gray-900">{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Mark Attendance", href: "/teacher/attendance" },
                { label: "Hifz Tracking", href: "/teacher/quran/hifz" },
                { label: "Students", href: "/teacher/students" },
                { label: "Assessments", href: "/teacher/assessments" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors text-center"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Students</h3>
            {stats.recentStudents.length === 0 ? (
              <p className="text-sm text-gray-400">No students at this branch yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentStudents.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{s.fullName}</p>
                      <p className="text-xs text-gray-400">{s.studentId} • {s.programType}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
