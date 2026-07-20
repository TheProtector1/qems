"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDaysToDateKey, todayDateKey } from "@/lib/timezone";
import { ShareToChatButton } from "@/components/common/share-to-chat";
import { buildReportShare } from "@/lib/share-templates";

type ReportType = "attendance" | "hifz" | "combined";

const REPORT_OPTIONS: Array<{ type: ReportType; label: string; description: string }> = [
  { type: "attendance", label: "Attendance Report", description: "Daily attendance log and summary for parents" },
  { type: "hifz", label: "Hifz Activity Report", description: "Lesson records, ratings, and surah progress" },
  { type: "combined", label: "Combined Report", description: "Full student overview — profile, attendance & hifz" },
];

type StudentReportsPanelProps = {
  studentId: string;
  studentName: string;
  program?: string;
  className?: string;
};

export function StudentReportsPanel({ studentId, studentName, program, className }: StudentReportsPanelProps) {
  const today = todayDateKey();
  const monthAgo = addDaysToDateKey(today, -30);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [downloading, setDownloading] = useState<ReportType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadReport = async (type: ReportType) => {
    setDownloading(type);
    setError(null);
    try {
      const params = new URLSearchParams({ type, from, to });
      const res = await fetch(`/api/institute/reports/${studentId}?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate report.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${studentName.replace(/\s+/g, "-")}-${type}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className={cn("dash-card bg-white overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary-700" />
        <div>
          <h3 className="font-display font-bold text-gray-900">PDF Reports for Parents</h3>
          <p className="text-xs text-gray-500">
            Download or share structured reports for {studentName}&apos;s parent/guardian
            {program ? ` · ${program}` : ""}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="form-input text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="form-input text-xs" />
          </div>
        </div>

        <div className="space-y-2">
          {REPORT_OPTIONS.map((opt) => {
            const disabled = downloading !== null || !!(opt.type === "hifz" && program && program !== "Hifz");
            return (
              <div
                key={opt.type}
                className="flex items-stretch gap-2 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all"
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => downloadReport(opt.type)}
                  className="flex-1 flex items-center justify-between text-left disabled:opacity-50 min-w-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                  {downloading === opt.type ? (
                    <Loader2 className="h-5 w-5 text-primary-600 animate-spin flex-shrink-0 ml-2" />
                  ) : (
                    <Download className="h-5 w-5 text-primary-600 flex-shrink-0 ml-2" />
                  )}
                </button>
                <ShareToChatButton
                  draft={buildReportShare({
                    studentName,
                    reportLabel: opt.label,
                    dateFrom: from,
                    dateTo: to,
                  })}
                  studentId={studentId}
                  variant="icon"
                  label={`Share ${opt.label}`}
                  disabled={disabled}
                  className="shrink-0 self-center"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
