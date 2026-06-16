import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentDashboardContent } from "@/components/parent/parent-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Parent Portal" };

export default async function ParentDashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell title="Parent Portal" breadcrumbs={[{ label: "My Child's Progress" }]}>
      <ParentDashboardContent />
    </DashboardShell>
  );
}
