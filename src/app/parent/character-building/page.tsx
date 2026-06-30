import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentCharacterBuildingContent } from "@/components/parent/parent-character-building-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Character Building - Parent Portal" };

export default async function ParentCharacterBuildingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Character Building"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Character Building" }]}
    >
      <ParentCharacterBuildingContent />
    </DashboardShell>
  );
}
