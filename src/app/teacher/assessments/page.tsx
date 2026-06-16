import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssessmentsContent } from "@/components/teacher/assessments-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Assessments - Teacher Portal" };

export default async function TeacherAssessmentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Assessments"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Assessments" }]}
    >
      <AssessmentsContent />
    </DashboardShell>
  );
}
