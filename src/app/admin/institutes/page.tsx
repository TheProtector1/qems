import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminInstitutesContent } from "@/components/admin/institutes-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Institutes Management – Super Admin Portal" };

export default async function AdminInstitutesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Registered Institutes"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Institutes" }]}
    >
      <AdminInstitutesContent />
    </DashboardShell>
  );
}
