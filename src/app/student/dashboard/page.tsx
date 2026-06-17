import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentDashboardContent } from "@/components/student/student-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell title="My Progress" breadcrumbs={[{ label: "Student Portal" }]}>
      <StudentDashboardContent />
    </DashboardShell>
  );
}
