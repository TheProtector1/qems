import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
<<<<<<< HEAD
import Link from "next/link";
=======
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
import { GitBranch, Plus, ShieldCheck, Mail, Phone, Users, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Branches - Institute Portal" };

const BRANCHES = [
  { id: "b1", name: "Main Campus (Gulshan)", manager: "Mufti Asim Hafeez", studentsCount: 184, teachersCount: 12, phone: "+92 21 3456789", email: "gulshan@qems.io", status: "ACTIVE" },
  { id: "b2", name: "Clifton Branch", manager: "Maulana Yousuf Siddiqui", studentsCount: 100, teachersCount: 6, phone: "+92 21 3987654", email: "clifton@qems.io", status: "ACTIVE" },
];

export default async function InstituteBranchesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Branches"
      breadcrumbs={[{ label: "Institute" }, { label: "Branches" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GitBranch className="h-6 w-6 text-primary-700" /> Campus Branches
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage details and staff allocation for different branches</p>
          </div>
<<<<<<< HEAD
          <Link href="/institute/settings" className="btn-primary text-xs py-2">
            <Plus className="h-4 w-4" /> Add Branch
          </Link>
=======
          <button className="btn-primary text-xs py-2">
            <Plus className="h-4 w-4" /> Add Branch
          </button>
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {BRANCHES.map((b) => (
            <div key={b.id} className="dash-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-gray-900">{b.name}</h3>
                  <span className="pill pill-success text-[10px] py-0.5">{b.status}</span>
                </div>

                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span>Manager: <strong>{b.manager}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Students: <strong>{b.studentsCount}</strong> • Teachers: <strong>{b.teachersCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{b.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-4 mt-2">
<<<<<<< HEAD
                <Link href="/institute/settings" className="btn-ghost flex-1 text-xs py-2 text-center">Edit Details</Link>
                <Link href="/institute/analytics" className="btn-primary flex-1 text-xs py-2 text-center">View Analytics</Link>
=======
                <button className="btn-ghost flex-1 text-xs py-2">Edit Details</button>
                <button className="btn-primary flex-1 text-xs py-2">View Analytics</button>
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
