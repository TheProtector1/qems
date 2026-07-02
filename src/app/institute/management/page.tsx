import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ManagementContent } from "@/components/institute/management-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Institute Leadership - QEMS" };

export default async function InstituteManagementPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const canEdit =
    session.user.role === "INSTITUTE_OWNER" || session.user.role === "SUPER_ADMIN";

  return (
    <DashboardShell
      title="Institute Leadership"
      breadcrumbs={[{ label: "Institute" }, { label: "Leadership" }]}
    >
      <ManagementContent canEdit={canEdit} />
    </DashboardShell>
  );
}
