import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentsContent } from "@/components/institute/students-content";
import { AdminAuditPanel } from "@/components/admin/admin-audit-panel";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "All Students — Super Admin" };

export default async function AdminStudentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="All Students"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Students" }]}
    >
      <div className="space-y-6">
        <StudentsContent role="admin" addHref="/institute/students/new" />
        <AdminAuditPanel limit={25} />
      </div>
    </DashboardShell>
  );
}
