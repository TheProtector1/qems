import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BarChart3, Download, RefreshCw } from "lucide-react";

export const metadata = { title: "Analytics & Reports - QEMS" };

export default async function InstituteAnalyticsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Analytics & Reports"
      breadcrumbs={[{ label: "Institute" }, { label: "Analytics" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary-700" /> Statistical Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Real-time charts, performance scores, and financial collections</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost text-xs py-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button className="btn-primary text-xs py-2">
              <Download className="h-4 w-4" /> Export Report
            </button>
          </div>
        </div>

        {/* We can directly leverage our beautiful charts and layouts inside InstituteDashboardContent to keep the styling extremely complete and visually stunning */}
        <InstituteDashboardContent />
      </div>
    </DashboardShell>
  );
}
