import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminSystemSettings } from "@/components/admin/system-settings";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "System Settings – Super Admin" };

export default async function AdminSettingsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="System Settings"
      breadcrumbs={[
        { label: "Super Admin", href: "/admin/dashboard" },
        { label: "Settings" },
      ]}
    >
      <AdminSystemSettings />
    </DashboardShell>
  );
}
