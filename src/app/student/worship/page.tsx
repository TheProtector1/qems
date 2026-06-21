import { DashboardShell } from "@/components/layout/dashboard-shell";
import { WorshipContent } from "@/components/student/worship-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Daily Spiritual Tracker - Student Portal" };

export default async function StudentWorshipPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  return (
    <DashboardShell
      title="Daily Worship Tracker"
      breadcrumbs={[
        { label: "Student Portal" },
        { label: "Spiritual Habits" }
      ]}
    >
      <WorshipContent />
    </DashboardShell>
  );
}
