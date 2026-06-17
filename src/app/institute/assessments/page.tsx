import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AssessmentsContent } from "@/components/teacher/assessments-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Assessments - Institute Owner Portal" };

export default async function InstituteAssessmentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Assessments"
      breadcrumbs={[{ label: "Institute" }, { label: "Assessments" }]}
    >
      <AssessmentsContent />
    </DashboardShell>
  );
}
