import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteReportsContent } from "@/components/institute/institute-reports-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Student Reports — Institute Portal" };

export default async function InstituteReportsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Student Reports"
      breadcrumbs={[{ label: "Institute" }, { label: "Reports" }]}
    >
      <InstituteReportsContent />
    </DashboardShell>
  );
}
