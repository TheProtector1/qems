import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminDashboardContent } from "@/components/admin/dashboard-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Super Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  
  return (
    <DashboardShell title="Super Admin Dashboard" breadcrumbs={[{ label: "System Admin" }, { label: "Dashboard" }]}>
      <AdminDashboardContent />
    </DashboardShell>
  );
}
