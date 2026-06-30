import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentAssessmentsContent } from "@/components/parent/parent-assessments-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Exam Results - Parent Portal" };

export default async function ParentAssessmentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Exam Results"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Exam Results" }]}
    >
      <ParentAssessmentsContent />
    </DashboardShell>
  );
}
