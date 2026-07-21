import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentTimetableContent } from "@/components/parent/parent-timetable-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Class Timetable — QEMS" };

export default async function ParentTimetablePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARENT") redirect("/dashboard");

  return (
    <DashboardShell
      title="Class Timetable"
      breadcrumbs={[
        { label: "Parent", href: "/parent/dashboard" },
        { label: "Timetable" },
      ]}
    >
      <ParentTimetableContent />
    </DashboardShell>
  );
}
