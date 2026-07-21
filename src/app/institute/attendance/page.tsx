import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AttendanceContent } from "@/components/institute/attendance-content";
import { LeaveRequestsPanel, QrCheckInPanel } from "@/components/institute/ops-panels";
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
