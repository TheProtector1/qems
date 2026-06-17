import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NewAssessmentForm } from "@/components/institute/new-assessment-form";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Schedule Assessment — QEMS" };

export default async function NewAssessmentPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Schedule Assessment"
      breadcrumbs={[
        { label: "Institute", href: "/institute/dashboard" },
        { label: "Assessments", href: "/institute/assessments" },
        { label: "New" }
      ]}
    >
      <NewAssessmentForm />
    </DashboardShell>
  );
}
