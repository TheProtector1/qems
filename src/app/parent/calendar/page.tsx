import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CalendarView } from "@/components/common/calendar-view";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Academic Calendar - QEMS" };

export default async function ParentCalendarPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARENT") redirect("/dashboard");

  return (
    <DashboardShell
      title="Academic Calendar"
      breadcrumbs={[
        { label: "Parent", href: "/parent/dashboard" },
        { label: "Calendar" }
      ]}
    >
      <CalendarView />
    </DashboardShell>
  );
}
