import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherDashboardContent } from "@/components/teacher/teacher-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Teacher Portal - QEMS" };

export default async function TeacherDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Teacher Hub"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Dashboard" }]}
    >
      <TeacherDashboardContent />
    </DashboardShell>
  );
}
