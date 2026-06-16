import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommunicationContent } from "@/components/common/communication-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Messaging - Parent Portal" };

export default async function ParentCommunicationPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Messaging & Notices"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Messaging" }]}
    >
      <CommunicationContent />
    </DashboardShell>
  );
}
