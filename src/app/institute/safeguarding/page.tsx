import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SafeguardingPageContent } from "@/components/institute/safeguarding-page-content";

export const metadata = { title: "Safeguarding & Protection - QEMS" };

export default async function InstituteSafeguardingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Safeguarding & Child Protection"
      breadcrumbs={[{ label: "Institute" }, { label: "Safeguarding" }]}
    >
      <SafeguardingPageContent />
    </DashboardShell>
  );
}
