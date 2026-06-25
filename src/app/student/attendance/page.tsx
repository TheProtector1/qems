import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentAttendanceView } from "@/components/student/student-attendance-view";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My Attendance - Student Portal" };

export default async function StudentAttendancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="My Attendance"
      breadcrumbs={[{ label: "Student Portal" }, { label: "My Attendance" }]}
    >
      <StudentAttendanceView />
    </DashboardShell>
  );
}
