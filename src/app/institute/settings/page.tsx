import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InstituteSettingsContent } from "@/components/institute/institute-settings-content";

export const metadata = { title: "Settings - Institute Portal" };

export default async function InstituteSettingsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Institute Settings"
      breadcrumbs={[{ label: "Institute" }, { label: "Settings" }]}
    >
      <InstituteSettingsContent />
    </DashboardShell>
  );
}
