import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentAttendanceContent } from "@/components/parent/parent-attendance-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Child Attendance - Parent Portal" };

export default async function ParentAttendancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Attendance Records"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Attendance" }]}
    >
      <ParentAttendanceContent />
    </DashboardShell>
  );
}
