import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminAnnouncementsContent } from "@/components/admin/admin-announcements-content";

export const metadata = { title: "System Announcements - Super Admin Portal" };

export default async function AdminAnnouncementsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="System Announcements"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Announcements" }]}
    >
      <AdminAnnouncementsContent />
    </DashboardShell>
  );
}
