import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentDashboardContent } from "@/components/parent/parent-dashboard";
import { getAuthSession } from "@/lib/auth";
import { getParentChildrenViewData } from "@/lib/parent-portal-data";
import { redirect } from "next/navigation";

export const metadata = { title: "Parent Portal — QEMS" };

export default async function ParentDashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const childrenData = await getParentChildrenViewData(session.user.id);

  return (
    <DashboardShell title="Parent Portal" breadcrumbs={[{ label: "My Child's Progress" }]}>
      <ParentDashboardContent childrenData={childrenData} />
    </DashboardShell>
  );
}
