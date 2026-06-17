import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CommunicationContent } from "@/components/common/communication-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Communication - Teacher Portal" };

export default async function TeacherCommunicationPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Messaging & Notices"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Communication" }]}
    >
      <CommunicationContent />
    </DashboardShell>
  );
}
