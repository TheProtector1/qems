"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Eye, CheckCircle, ShieldCheck, History, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CaseRow = {
  id: string;
  dbId: string;
  student: string;
  reporter: string;
  type: string;
  severity: string;
  status: string;
  date: string;
  desc: string;
  auditLogs: { text: string; date: string }[];
};

export function SafeguardingPageContent() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [logs, setLogs] = useState<{ text: string; date: string }[]>([]);
  const [summary, setSummary] = useState({ activeCount: 0, resolvedYtd: 0, compliant: true });
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/complaints");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCases(data.cases || []);
      setLogs(data.logs || []);
      setSummary(data.summary || { activeCount: 0, resolvedYtd: 0, compliant: true });
    } catch (err) {
      console.error(err);
      setCases([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleReport = async () => {
    const title = prompt("Brief incident title:");
    if (!title?.trim()) return;
    const desc = prompt("Describe the incident:");
    if (!desc?.trim()) return;
    const involved = prompt("Involved parties (optional):") || undefined;

    const res = await fetch("/api/institute/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, involvedParties: involved }),
    });

    if (res.ok) {
      await loadCases();
      const data = await res.json();
      setExpandedCase(data.complaint?.caseNumber || null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading safeguarding records...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary-700" /> Safeguarding Center
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Report incidents, track compliance cases, and view protection logs</p>
        </div>
        <button className="btn-primary text-xs py-2" onClick={handleReport}>
          <Plus className="h-4 w-4" /> Report Incident
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="dash-card p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs text-green-100 font-semibold uppercase">Compliance Status</p>
            <p className="font-display text-2xl font-bold mt-1">
              {summary.compliant ? "100% Compliant" : "Action Required"}
            </p>
          </div>
          <ShieldCheck className="h-10 w-10 text-green-100 opacity-80" />
        </div>

        <div className="dash-card p-5 bg-amber-50 border border-amber-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-600 font-semibold uppercase">Active Cases</p>
            <p className="font-display text-2xl font-bold text-amber-700 mt-1">
              {summary.activeCount} Case{summary.activeCount !== 1 ? "s" : ""} Open
            </p>
          </div>
          <AlertTriangle className="h-10 w-10 text-amber-500 opacity-80" />
        </div>

        <div className="dash-card p-5 bg-blue-50 border border-blue-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-blue-600 font-semibold uppercase">Resolved (YTD)</p>
            <p className="font-display text-2xl font-bold text-blue-700 mt-1">
              {summary.resolvedYtd} Cases
            </p>
          </div>
          <CheckCircle className="h-10 w-10 text-blue-500 opacity-80" />
        </div>
      </div>

      <div className="dash-card overflow-hidden bg-white">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-gray-900">Incident Registry</h3>
        </div>
        {cases.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No incidents reported yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {cases.map((c) => (
              <div key={c.id} className="p-5 hover:bg-gray-50/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                      {c.id}
                    </span>
                    <h4 className="font-semibold text-gray-900 text-sm">Involved: {c.student}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("pill text-[10px] py-0.5", c.severity === "High" || c.severity === "Critical" ? "pill-danger" : "pill-warning")}>
                      {c.severity} Severity
                    </span>
                    <span className={cn("pill text-[10px] py-0.5", c.status === "RESOLVED" || c.status === "CLOSED" ? "pill-success" : "pill-warning")}>
                      {c.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{c.desc}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-100/70 text-xs text-gray-400">
                  <div className="flex gap-4">
                    <span>Reporter: <strong>{c.reporter}</strong></span>
                    <span>Date: {c.date}</span>
                    <span>Type: {c.type}</span>
                  </div>
                  <button
                    className="flex items-center gap-1 text-primary-700 font-semibold hover:underline"
                    onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                  >
                    <Eye className="h-3.5 w-3.5" /> View Logs
                  </button>
                </div>

                {expandedCase === c.id && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1">
                    <p><strong>Case ID:</strong> {c.id}</p>
                    <p><strong>Status:</strong> {c.status.replace("_", " ")}</p>
                    <p><strong>Full description:</strong> {c.desc}</p>
                    {c.auditLogs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.auditLogs.map((log, i) => (
                          <p key={i}>{log.text} — {log.date}</p>
                        ))}
                      </div>
                    )}
                    <Link href="/institute/communication" className="text-primary-700 font-semibold hover:underline inline-block mt-1">
                      Notify involved parties →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-card p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <History className="h-4.5 w-4.5 text-gray-400" /> Immutable Action Logs
        </h3>
        {logs.length === 0 ? (
          <p className="text-sm text-gray-400">No audit logs yet.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                <span className="h-2 w-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700">{log.text}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{log.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
