import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceContent } from "@/components/institute/attendance-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Attendance Entry - Teacher Portal" };

export default async function TeacherAttendancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Attendance Entry"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Attendance Entry" }]}
    >
      <AttendanceContent />
    </DashboardShell>
  );
}
