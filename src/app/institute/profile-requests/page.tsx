import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileRequestsPanel } from "@/components/common/profile-requests-panel";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserCheck } from "lucide-react";

export const metadata = { title: "Profile Change Requests" };

export default async function InstituteProfileRequestsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "INSTITUTE_OWNER") redirect("/dashboard");

  return (
    <DashboardShell
      title="Profile Approvals"
      breadcrumbs={[{ label: "Institute" }, { label: "Profile Approvals" }]}
    >
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary-700" /> Profile change requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review name, email, and phone updates from teachers, parents, students, and staff.
          </p>
        </div>
        <div className="dash-card p-5">
          <ProfileRequestsPanel apiBase="/api/institute/profile-requests" />
        </div>
      </div>
    </DashboardShell>
  );
}
