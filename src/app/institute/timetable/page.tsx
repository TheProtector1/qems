import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TimetableContent } from "@/components/institute/timetable-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Class Timetable — QEMS" };

export default async function InstituteTimetablePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Class Timetable"
      breadcrumbs={[{ label: "Institute" }, { label: "Timetable" }]}
    >
      <TimetableContent />
    </DashboardShell>
  );
}
