"use client";

import { useRouter } from "next/navigation";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { downloadCsv } from "@/lib/utils";

export function AnalyticsPageContent() {
  const router = useRouter();

  const handleRefresh = () => router.refresh();
  const handleExport = () => {
    downloadCsv(
      "institute-analytics-report.csv",
      ["Metric", "Value", "Change"],
      [
        ["Total Students", "284", "+12"],
        ["Attendance Rate", "94.7%", "+1.2%"],
        ["Hifz Quality Score", "8.4 / 10", "+0.3"],
        ["Fee Collection", "PKR 1.8M", "-PKR 120K"],
        ["Active Teachers", "18", "+2"],
        ["Completions (YTD)", "12", "+5"],
      ]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary-700" /> Statistical Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time charts, performance scores, and financial collections</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost text-xs py-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button className="btn-primary text-xs py-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <InstituteDashboardContent />
    </div>
  );
}
