import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentCalendarView } from "@/components/student/student-calendar-view";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "My Calendar - Student Portal" };

export default async function StudentCalendarPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  return (
    <DashboardShell
      title="My Calendar"
      breadcrumbs={[
        { label: "Student", href: "/student/dashboard" },
        { label: "Calendar" }
      ]}
    >
      <StudentCalendarView />
    </DashboardShell>
  );
}
