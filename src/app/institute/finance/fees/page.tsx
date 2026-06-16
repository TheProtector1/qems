import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FinanceContent } from "@/components/institute/finance-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Fee Management" };

export default async function FinancePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Fee & Finance"
      breadcrumbs={[{ label: "Finance" }, { label: "Fee Management" }]}
    >
      <FinanceContent />
    </DashboardShell>
  );
}
