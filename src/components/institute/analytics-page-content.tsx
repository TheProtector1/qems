"use client";

import { useRouter } from "next/navigation";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { downloadCsv } from "@/lib/utils";
import type { InstituteAnalytics } from "@/lib/institute-analytics";

export function AnalyticsPageContent({
  initialAnalytics,
}: {
  initialAnalytics: InstituteAnalytics;
}) {
  const router = useRouter();

  const handleRefresh = () => router.refresh();
  const handleExport = () => {
    const k = initialAnalytics.kpis;
    downloadCsv(
      "institute-analytics-report.csv",
      ["Metric", "Value"],
      [
        ["Total Students", String(k.totalStudents)],
        ["Attendance Rate", `${k.attendanceRate}%`],
        ["Hifz Quality Score", k.qualityScore != null ? `${k.qualityScore}/10` : "—"],
        ["Fee Collected", String(k.totalCollected)],
        ["Outstanding Fees", String(k.totalOutstanding)],
        ["Active Teachers", String(k.activeTeachers)],
        ["Hifz Completions", String(k.hifzCompletions)],
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
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time charts, performance scores, and financial collections
          </p>
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

      <InstituteDashboardContent
        initialTotalStudents={initialAnalytics.kpis.totalStudents}
        initialActiveTeachers={initialAnalytics.kpis.activeTeachers}
        initialAnalytics={initialAnalytics}
      />
    </div>
  );
}
