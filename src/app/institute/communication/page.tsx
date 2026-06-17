import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommunicationContent } from "@/components/common/communication-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Communication - Institute Owner Portal" };

export default async function InstituteCommunicationPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Notice Board & Chat"
      breadcrumbs={[{ label: "Institute" }, { label: "Communication" }]}
    >
      <CommunicationContent />
    </DashboardShell>
  );
}
