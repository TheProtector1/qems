import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceContent } from "@/components/institute/attendance-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Attendance"
      breadcrumbs={[{ label: "Institute" }, { label: "Attendance" }]}
    >
      <AttendanceContent />
    </DashboardShell>
  );
}
