import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, Clock, CheckCircle2, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admissions — QEMS" };

const APPLICATIONS = [
  { id: "APP-001", name: "Khalid Mehmood", program: "Hifz", stage: "INTERVIEW", date: "June 14, 2025", parent: "Mehmood Tariq" },
  { id: "APP-002", name: "Ayesha Bibi", program: "Nazra", stage: "APPROVED", date: "June 12, 2025", parent: "Ali Rehman" },
  { id: "APP-003", name: "Bilal Farooq", program: "Hifz", stage: "APPLICATION", date: "June 15, 2025", parent: "Farooq Shah" },
  { id: "APP-004", name: "Hira Noor", program: "Tajweed", stage: "ENROLLED", date: "June 10, 2025", parent: "Noor Muhammad" },
];

const stageConfig: Record<string, { label: string; pill: string }> = {
  APPLICATION: { label: "Application Received", pill: "pill-info" },
  INTERVIEW: { label: "Interview Scheduled", pill: "pill-warning" },
  APPROVED: { label: "Approved", pill: "pill-success" },
  ENROLLED: { label: "Enrolled", pill: "pill-primary" },
  REJECTED: { label: "Rejected", pill: "pill-danger" },
};

export default async function AdmissionsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Admissions"
      breadcrumbs={[{ label: "Students", href: "/institute/students" }, { label: "Admissions" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading">Admission Pipeline</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track applications from submission to enrollment</p>
          </div>
          <Link href="/institute/students/admissions/new" className="btn-primary text-sm py-2">
            <Plus className="h-4 w-4" /> New Application
          </Link>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Applications", count: 1, color: "bg-blue-50 text-blue-700" },
            { label: "Interview", count: 1, color: "bg-amber-50 text-amber-700" },
            { label: "Approved", count: 1, color: "bg-green-50 text-green-700" },
            { label: "Enrolled", count: 1, color: "bg-primary-50 text-primary-700" },
          ].map((s) => (
            <div key={s.label} className={cn("kpi-card p-4 flex items-center gap-3", s.color.split(" ")[0])}>
              <ClipboardList className={cn("h-8 w-8 opacity-70", s.color.split(" ")[1])} />
              <div>
                <p className={cn("font-display text-2xl font-bold", s.color.split(" ")[1])}>{s.count}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="dash-card p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input placeholder="Search applicants..." className="form-input pl-10 h-10 text-xs" />
          </div>
        </div>

        {/* Table */}
        <div className="dash-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Student Name</th>
                <th>Parent</th>
                <th>Program</th>
                <th>Stage</th>
                <th>Applied On</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.map((a) => {
                const cfg = stageConfig[a.stage];
                return (
                  <tr key={a.id}>
                    <td className="font-mono text-xs font-bold text-primary-700">{a.id}</td>
                    <td className="font-semibold text-gray-900">{a.name}</td>
                    <td className="text-sm text-gray-600">{a.parent}</td>
                    <td><span className="pill pill-primary text-[10px] py-0.5">{a.program}</span></td>
                    <td><span className={cn("pill text-[10px] py-0.5", cfg.pill)}>{cfg.label}</span></td>
                    <td className="text-xs text-gray-400">{a.date}</td>
                    <td className="text-right">
                      <button className="btn-ghost text-[10px] py-1 px-2">Review</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
