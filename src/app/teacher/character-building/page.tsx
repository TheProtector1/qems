import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherCharacterBuildingTabs } from "@/components/teacher/teacher-character-building-tabs";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Character Building & Daily Duas - Teacher Hub" };

export default async function TeacherCharacterBuildingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "TEACHER") redirect("/dashboard");

  return (
    <DashboardShell
      title="Character Building Tasks"
      breadcrumbs={[
        { label: "Teacher Portal", href: "/teacher/dashboard" },
        { label: "Character Building" }
      ]}
    >
      <TeacherCharacterBuildingTabs />
    </DashboardShell>
  );
}
