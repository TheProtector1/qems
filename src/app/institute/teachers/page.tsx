import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserCheck, Plus, Search, Mail, Phone, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Teachers - Institute Portal" };

const TEACHERS = [
  { id: "t1", name: "Qari Hamid", email: "hamid@demo.com", phone: "+92 312 3456789", program: "Hifz", classes: "Hifz A, Hifz B", status: "ACTIVE" },
  { id: "t2", name: "Qari Yousuf", email: "yousuf@demo.com", phone: "+92 333 9876543", program: "Nazra", classes: "Nazra B, Nazra C", status: "ACTIVE" },
  { id: "t3", name: "Qari Bilal", email: "bilal@demo.com", phone: "+92 345 5556667", program: "Tajweed", classes: "Tajweed Intermediate", status: "ACTIVE" },
  { id: "t4", name: "Qaria Ayesha", email: "ayesha@demo.com", phone: "+92 321 8889990", program: "Hifz", classes: "Hifz Girls", status: "ON_LEAVE" },
];

export default async function InstituteTeachersPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Teachers Directory"
      breadcrumbs={[{ label: "Institute" }, { label: "Teachers" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary-700" /> Teaching Faculty
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage details and course assignments for instructors</p>
          </div>
          <button className="btn-primary text-xs py-2">
            <Plus className="h-4 w-4" /> Add Teacher
          </button>
        </div>

        {/* ── Search Bar ── */}
        <div className="dash-card p-4 bg-white flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search teacher by name or email..."
              className="form-input pl-10 h-10 text-xs"
            />
          </div>
        </div>

        {/* ── Roster Table ── */}
        <div className="dash-card overflow-hidden bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Teacher Name</th>
                <th>Program Specialty</th>
                <th>Assigned Classes</th>
                <th>Contact info</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {TEACHERS.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs">
                        {t.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="pill pill-primary text-[10px] py-0.5">{t.program}</span>
                  </td>
                  <td>
                    <span className="text-xs text-gray-600 font-medium">{t.classes}</span>
                  </td>
                  <td>
                    <div className="text-xs text-gray-500">
                      <p>{t.phone}</p>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "pill text-[10px] py-0.5",
                      t.status === "ACTIVE" ? "pill-success" : "pill-warning"
                    )}>
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="btn-ghost text-xs py-1 px-3">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
