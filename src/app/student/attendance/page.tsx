import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceContent } from "@/components/institute/attendance-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My Attendance - Student Portal" };

export default async function StudentAttendancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="My Attendance History"
      breadcrumbs={[{ label: "Student Portal" }, { label: "My Attendance" }]}
    >
      <AttendanceContent readOnly />
    </DashboardShell>
  );
}
