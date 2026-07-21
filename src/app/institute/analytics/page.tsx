import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnalyticsPageContent } from "@/components/institute/analytics-page-content";
import { getCachedInstituteAnalytics } from "@/lib/server-cache";

export const metadata = { title: "Analytics & Reports - QEMS" };

export default async function InstituteAnalyticsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const instituteId = session.user.instituteId;
  if (!instituteId) redirect("/dashboard");

  const analytics = await getCachedInstituteAnalytics(instituteId);

  return (
    <DashboardShell
      title="Analytics & Reports"
      breadcrumbs={[{ label: "Institute" }, { label: "Analytics" }]}
    >
      <Suspense fallback={<div className="py-12 text-center text-sm text-gray-400">Loading analytics…</div>}>
        <AnalyticsPageContent initialAnalytics={analytics} />
      </Suspense>
    </DashboardShell>
  );
}
