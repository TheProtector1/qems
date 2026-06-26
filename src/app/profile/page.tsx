import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfileSettingsContent } from "@/components/common/profile-settings-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell title="My Profile" breadcrumbs={[{ label: "Profile" }]}>
      <ProfileSettingsContent />
    </DashboardShell>
  );
}
