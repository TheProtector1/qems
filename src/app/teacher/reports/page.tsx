import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteReportsContent } from "@/components/institute/institute-reports-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Student Reports — Teacher Portal" };

export default async function TeacherReportsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Student Reports"
      breadcrumbs={[{ label: "Teacher" }, { label: "Reports" }]}
    >
      <InstituteReportsContent />
    </DashboardShell>
  );
}
