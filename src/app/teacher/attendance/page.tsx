import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceContent } from "@/components/institute/attendance-content";
import { LeaveRequestsPanel, QrCheckInPanel } from "@/components/institute/ops-panels";
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
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-4">
          <QrCheckInPanel />
          <LeaveRequestsPanel />
        </div>
        <AttendanceContent />
      </div>
    </DashboardShell>
  );
}
