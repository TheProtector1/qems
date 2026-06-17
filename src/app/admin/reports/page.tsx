import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteReportsContent } from "@/components/institute/institute-reports-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Student Reports — Super Admin" };

export default async function AdminReportsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Student Reports"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Reports" }]}
    >
      <InstituteReportsContent />
    </DashboardShell>
  );
}
