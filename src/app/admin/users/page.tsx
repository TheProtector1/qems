import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminUsersContent } from "@/components/admin/users-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Users Management – Super Admin" };

export default async function AdminUsersPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Platform Users"
      breadcrumbs={[
        { label: "Super Admin", href: "/admin/dashboard" },
        { label: "Users" },
      ]}
    >
      <AdminUsersContent />
    </DashboardShell>
  );
}
