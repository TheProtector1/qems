import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCachedInstituteAnalytics } from "@/lib/server-cache";

export const metadata = { title: "Institute Dashboard" };

export default async function InstituteDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const instituteId = session.user.instituteId;
  if (!instituteId) redirect("/dashboard");

  const analytics = await getCachedInstituteAnalytics(instituteId);

  return (
    <DashboardShell
      title="Dashboard"
      breadcrumbs={[{ label: "Institute" }, { label: "Dashboard" }]}
    >
      <InstituteDashboardContent
        initialTotalStudents={analytics.kpis.totalStudents}
        initialActiveTeachers={analytics.kpis.activeTeachers}
        initialAnalytics={analytics}
      />
    </DashboardShell>
  );
}
