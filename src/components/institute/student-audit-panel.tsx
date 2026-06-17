"use client";

import { useEffect, useState } from "react";
import { Clock, History, Loader2, User } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  entityLabel: string | null;
  action: string;
  details: string | null;
  performerRole: string;
  createdAt: string;
  performedBy: { id: string; name: string; role: string };
};

type StudentAuditPanelProps = {
  studentId?: string;
  title?: string;
  limit?: number;
  className?: string;
};

const roleLabels: Record<string, string> = {
  TEACHER: "Teacher",
  BRANCH_MANAGER: "Branch Manager",
  INSTITUTE_OWNER: "Institute Owner",
  SUPER_ADMIN: "Super Admin",
};

const actionStyles: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

function formatActionDetails(details: string | null) {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details) as {
      changes?: Array<{ field: string; from: unknown; to: unknown }>;
      summary?: string;
    };
    if (parsed.summary) return parsed.summary;
    if (parsed.changes?.length) {
      return parsed.changes
        .map((c) => `${c.field}: ${String(c.from ?? "—")} → ${String(c.to ?? "—")}`)
        .join("; ");
    }
  } catch {
    return details;
  }
  return null;
}

export function StudentAuditPanel({
  studentId,
  title = "Audit Trail",
  limit = 10,
  className,
}: StudentAuditPanelProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (studentId) params.set("studentId", studentId);

    fetch(`/api/institute/audit-logs?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load audit trail.");
        }
        return res.json();
      })
      .then((data) => setLogs(data.logs || []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId, limit]);

  return (
    <div className={cn("dash-card bg-white overflow-hidden", className)}>
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <History className="h-5 w-5 text-primary-700" />
        <div>
          <h3 className="font-display font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">
            {studentId
              ? "Changes by teachers and staff visible to institute owners"
              : "Recent student updates by teachers and staff"}
          </p>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading activity...
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center py-6">{error}</p>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No audit entries yet.</p>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="space-y-4">
            {logs.map((log) => {
              const detailText = formatActionDetails(log.details);
              return (
                <div key={log.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{log.performedBy.name}</span>
                      <span className="text-[10px] font-medium text-gray-500">
                        {roleLabels[log.performerRole] || log.performerRole}
                      </span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", actionStyles[log.action] || "bg-gray-100 text-gray-600")}>
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {log.entityLabel || log.entityType} {log.entityType === "STUDENT" ? "profile" : ""}
                    </p>
                    {detailText && (
                      <p className="text-[11px] text-gray-500 mt-1 break-words">{detailText}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.createdAt)} · {new Date(log.createdAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
