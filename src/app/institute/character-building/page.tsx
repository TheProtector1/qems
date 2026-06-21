import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CharacterBuildingContent } from "@/components/institute/character-building-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Character Building Tasks - QEMS" };

export default async function CharacterBuildingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "INSTITUTE_OWNER") redirect("/dashboard");

  return (
    <DashboardShell
      title="Character Building"
      breadcrumbs={[
        { label: "Institute", href: "/institute/dashboard" },
        { label: "Character Building" }
      ]}
    >
      <CharacterBuildingContent />
    </DashboardShell>
  );
}
