import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherCharacterBuildingContent } from "@/components/teacher/teacher-character-building-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Character Building - Teacher Hub" };

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
      <TeacherCharacterBuildingContent />
    </DashboardShell>
  );
}
