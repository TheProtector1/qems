import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdmissionsContent } from "@/components/institute/admissions-content";

export const metadata = { title: "Admissions — QEMS" };

export default async function AdmissionsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Admissions"
      breadcrumbs={[{ label: "Students", href: "/institute/students" }, { label: "Admissions" }]}
    >
      <AdmissionsContent />
    </DashboardShell>
  );
}
