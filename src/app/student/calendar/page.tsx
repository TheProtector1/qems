import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CalendarView } from "@/components/common/calendar-view";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Academic Calendar - QEMS" };

export default async function StudentCalendarPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  return (
    <DashboardShell
      title="Academic Calendar"
      breadcrumbs={[
        { label: "Student", href: "/student/dashboard" },
        { label: "Calendar" }
      ]}
    >
      <CalendarView />
    </DashboardShell>
  );
}
