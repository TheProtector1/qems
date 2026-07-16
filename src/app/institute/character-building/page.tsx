import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CharacterBuildingTabs } from "@/components/institute/character-building-tabs";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Character Building & Daily Duas - QEMS" };

export default async function CharacterBuildingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const allowed = ["INSTITUTE_OWNER", "BRANCH_MANAGER", "SUPER_ADMIN"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  return (
    <DashboardShell
      title="Character Building"
      breadcrumbs={[
        { label: "Institute", href: "/institute/dashboard" },
        { label: "Character Building" }
      ]}
    >
      <CharacterBuildingTabs />
    </DashboardShell>
  );
}
