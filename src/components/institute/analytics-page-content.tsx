"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { downloadCsv } from "@/lib/utils";
import type { InstituteAnalytics } from "@/lib/institute-analytics";

type BranchOption = { id: string; name: string };

export function AnalyticsPageContent({
  initialAnalytics,
}: {
  initialAnalytics: InstituteAnalytics;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchId = searchParams.get("branchId") || "";
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/institute/branches")
      .then((r) => r.json())
      .then((d) => setBranches(d.branches || d || []))
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    setAnalytics(initialAnalytics);
  }, [initialAnalytics]);

  useEffect(() => {
    if (!branchId) {
      setAnalytics(initialAnalytics);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/institute/analytics?branchId=${encodeURIComponent(branchId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.kpis) setAnalytics(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId, initialAnalytics]);

  const handleRefresh = () => router.refresh();

  const setBranch = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("branchId", id);
    else params.delete("branchId");
    const q = params.toString();
    router.push(q ? `/institute/analytics?${q}` : "/institute/analytics");
  };

  const handleExport = () => {
    const k = analytics.kpis;
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
        ["Total Alumni", String(k.totalAlumni)],
        ["Branch Scope", branchId || "All branches"],
      ]
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary-700" /> Statistical Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time charts, performance scores, and financial collections
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {branches.length > 0 && (
            <select
              className="form-input text-xs py-2 w-auto"
              value={branchId}
              onChange={(e) => setBranch(e.target.value)}
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <button className="btn-ghost text-xs py-2" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button className="btn-primary text-xs py-2" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <InstituteDashboardContent
        initialTotalStudents={analytics.kpis.totalStudents}
        initialActiveTeachers={analytics.kpis.activeTeachers}
        initialAnalytics={analytics}
      />
    </div>
  );
}
