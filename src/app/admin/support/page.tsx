import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSupportContent } from "@/components/admin/admin-support-content";

export const metadata = { title: "Support Tickets - Super Admin Portal" };

export default async function AdminSupportPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Platform Support Tickets"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Support Tickets" }]}
    >
      <AdminSupportContent />
    </DashboardShell>
  );
}
