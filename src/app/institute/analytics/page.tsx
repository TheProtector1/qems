import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsPageContent } from "@/components/institute/analytics-page-content";

export const metadata = { title: "Analytics & Reports - QEMS" };

export default async function InstituteAnalyticsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Analytics & Reports"
      breadcrumbs={[{ label: "Institute" }, { label: "Analytics" }]}
    >
      <AnalyticsPageContent />
    </DashboardShell>
  );
}
