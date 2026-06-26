import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SalariesPageContent } from "@/components/institute/salaries-page-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Salaries & Payroll" };

export default async function SalariesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "INSTITUTE_OWNER") redirect("/dashboard");

  return (
    <DashboardShell
      title="Salaries & Payroll"
      breadcrumbs={[{ label: "Finance" }, { label: "Salaries" }]}
    >
      <SalariesPageContent />
    </DashboardShell>
  );
}
