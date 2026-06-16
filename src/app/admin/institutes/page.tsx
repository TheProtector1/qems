import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, Search, Check, X, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Institutes Management - Super Admin Portal" };

const INSTITUTES = [
  { id: "i1", name: "Dar ul Uloom Karachi", owner: "Mufti Asim", studentsCount: 320, plan: "Enterprise", status: "APPROVED", registered: "June 01, 2025" },
  { id: "i2", name: "Al-Huda International", owner: "Farhat Hashmi", studentsCount: 1450, plan: "Enterprise", status: "APPROVED", registered: "May 20, 2025" },
  { id: "i3", name: "Tanzeem-ul-Madaris", owner: "Mufti Muneeb", studentsCount: 84, plan: "Growth", status: "PENDING", registered: "June 14, 2025" },
  { id: "i4", name: "Tajweed Academy UK", owner: "Qari Abdur Rahman", studentsCount: 42, plan: "Starter", status: "REJECTED", registered: "May 10, 2025" },
];

export default async function AdminInstitutesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Registered Institutes"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Institutes" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary-700" /> Platform Tenants
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Approve, restrict, and manage registered Quran institutes</p>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="dash-card p-4 bg-white flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search institutes by name or owner..."
              className="form-input pl-10 h-10 text-xs"
            />
          </div>
        </div>

        {/* ── Institutes List ── */}
        <div className="dash-card overflow-hidden bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Institute Name</th>
                <th>Owner / Contact</th>
                <th>Active Plan</th>
                <th>Active Students</th>
                <th>Status</th>
                <th>Registered Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {INSTITUTES.map((inst) => (
                <tr key={inst.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-xs">
                        <Building2 className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{inst.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {inst.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-semibold text-gray-800">{inst.owner}</p>
                  </td>
                  <td>
                    <span className="pill pill-primary text-[10px] py-0.5">{inst.plan}</span>
                  </td>
                  <td>
                    <span className="text-xs text-gray-600 font-semibold">{inst.studentsCount}</span>
                  </td>
                  <td>
                    <span className={cn(
                      "pill text-[10px] py-0.5",
                      inst.status === "APPROVED" && "pill-success",
                      inst.status === "PENDING" && "pill-warning",
                      inst.status === "REJECTED" && "pill-danger"
                    )}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">{inst.registered}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {inst.status === "PENDING" && (
                        <>
                          <button className="p-1 rounded bg-green-50 text-green-600 hover:bg-green-100 border border-green-200" title="Approve">
                            <Check className="h-4 w-4" />
                          </button>
                          <button className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" title="Reject">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button className="btn-ghost text-[10px] py-1 px-2">Manage</button>
                    </div>
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
