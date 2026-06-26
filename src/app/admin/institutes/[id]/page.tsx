import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EditInstituteContent } from "@/components/admin/edit-institute-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Edit Institute — Super Admin" };

export default async function AdminInstituteDetailPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Edit Institute"
      breadcrumbs={[
        { label: "Super Admin", href: "/admin/dashboard" },
        { label: "Institutes", href: "/admin/institutes" },
        { label: "Edit" },
      ]}
    >
      <EditInstituteContent />
    </DashboardShell>
  );
}
