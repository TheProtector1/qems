import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentCharacterBuildingTabs } from "@/components/parent/parent-character-building-tabs";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Character Building & Daily Duas - Parent Portal" };

export default async function ParentCharacterBuildingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARENT") redirect("/dashboard");

  return (
    <DashboardShell
      title="Character Building"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Character Building" }]}
    >
      <ParentCharacterBuildingTabs />
    </DashboardShell>
  );
}
