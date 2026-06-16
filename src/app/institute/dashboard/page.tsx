import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Institute Dashboard" };

export default async function InstituteDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Dashboard"
      breadcrumbs={[{ label: "Institute" }, { label: "Dashboard" }]}
    >
      <InstituteDashboardContent />
    </DashboardShell>
  );
}
