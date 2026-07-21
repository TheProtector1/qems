import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FinanceContent } from "@/components/institute/finance-content";
import { FeeOpsPanel } from "@/components/institute/fee-ops-panel";
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
      <div className="space-y-6">
        <FeeOpsPanel />
        <FinanceContent />
      </div>
    </DashboardShell>
  );
}
