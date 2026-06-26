import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileRequestsPanel } from "@/components/common/profile-requests-panel";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";

export const metadata = { title: "Profile Approvals — Super Admin" };

export default async function AdminProfileRequestsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Profile Approvals"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Profile Approvals" }]}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary-700" /> Institute owner profile requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Approve name, email, and phone changes submitted by institute owners.
          </p>
        </div>
        <div className="dash-card p-5">
          <ProfileRequestsPanel apiBase="/api/admin/profile-requests" />
        </div>
      </div>
    </DashboardShell>
  );
}
