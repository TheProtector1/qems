import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CalendarContent } from "@/components/institute/calendar-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Academic Calendar - QEMS" };

export default async function InstituteCalendarPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "INSTITUTE_OWNER") redirect("/dashboard");

  return (
    <DashboardShell
      title="Academic Calendar"
      breadcrumbs={[
        { label: "Institute", href: "/institute/dashboard" },
        { label: "Calendar" }
      ]}
    >
      <CalendarContent />
    </DashboardShell>
  );
}
