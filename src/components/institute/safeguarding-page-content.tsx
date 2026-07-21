"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Eye,
  CheckCircle,
  ShieldCheck,
  History,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CaseRow = {
  id: string;
  dbId: string;
  student: string;
  reporter: string;
  type: string;
  category?: string;
  severity: string;
  status: string;
  date: string;
  desc: string;
  evidenceNotes?: string | null;
  isConfidential?: boolean;
  resolution?: string | null;
  auditLogs: { text: string; date: string }[];
};

const CATEGORY_OPTIONS = [
  "GENERAL",
  "BULLYING",
  "NEGLECT",
  "ABUSE",
  "SAFETY",
  "BEHAVIOUR",
  "WELFARE",
];

const STATUS_OPTIONS = ["OPEN", "UNDER_INVESTIGATION", "RESOLVED", "CLOSED"];

export function SafeguardingPageContent() {
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [logs, setLogs] = useState<{ text: string; date: string }[]>([]);
  const [summary, setSummary] = useState({ activeCount: 0, resolvedYtd: 0, compliant: true });
  const [categories, setCategories] = useState<string[]>(CATEGORY_OPTIONS);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    involvedParties: "",
    category: "GENERAL",
    severity: "MEDIUM",
    evidenceNotes: "",
    isConfidential: true,
  });

  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/complaints");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setCases(data.cases || []);
      setLogs(data.logs || []);
      setSummary(data.summary || { activeCount: 0, resolvedYtd: 0, compliant: true });
      if (data.categories?.length) setCategories(data.categories);
    } catch (err) {
      console.error(err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const handleReport = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/institute/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Incident recorded");
      setShowForm(false);
      setForm({
        title: "",
        description: "",
        involvedParties: "",
        category: "GENERAL",
        severity: "MEDIUM",
        evidenceNotes: "",
        isConfidential: true,
      });
      await loadCases();
      setExpandedCase(data.complaint?.caseNumber || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (dbId: string, status: string) => {
    const resolution =
      status === "RESOLVED" || status === "CLOSED"
        ? prompt("Resolution notes (optional):") || undefined
        : undefined;
    try {
      const res = await fetch("/api/institute/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: dbId, status, resolution }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Update failed");
      }
      toast.success("Case updated");
      await loadCases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
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
          <p className="text-sm text-gray-500 mt-0.5">
            Categorised intake, evidence notes, and confidential case workflow
          </p>
        </div>
        <button className="btn-primary text-xs py-2" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Report Incident
        </button>
      </div>

      {showForm && (
        <div className="dash-card bg-white p-5 space-y-3 border border-primary-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">New safeguarding case</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              className="form-input text-xs sm:col-span-2"
              placeholder="Incident title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <select
              className="form-input text-xs"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="form-input text-xs"
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input
              className="form-input text-xs sm:col-span-2"
              placeholder="Involved parties"
              value={form.involvedParties}
              onChange={(e) => setForm((f) => ({ ...f, involvedParties: e.target.value }))}
            />
            <textarea
              className="form-input text-xs sm:col-span-2 min-h-[80px]"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <textarea
              className="form-input text-xs sm:col-span-2 min-h-[60px]"
              placeholder="Evidence / witness notes (staff only)"
              value={form.evidenceNotes}
              onChange={(e) => setForm((f) => ({ ...f, evidenceNotes: e.target.value }))}
            />
            <label className="flex items-center gap-2 text-xs text-gray-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isConfidential}
                onChange={(e) => setForm((f) => ({ ...f, isConfidential: e.target.checked }))}
                className="rounded"
              />
              Mark as confidential
            </label>
          </div>
          <button className="btn-primary text-xs py-2" disabled={saving} onClick={handleReport}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit case"}
          </button>
        </div>
      )}

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
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                      {c.id}
                    </span>
                    {c.category && (
                      <span className="pill text-[10px] py-0.5 pill-info">{c.category}</span>
                    )}
                    <h4 className="font-semibold text-gray-900 text-sm">Involved: {c.student}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "pill text-[10px] py-0.5",
                        c.severity === "High" || c.severity === "Critical"
                          ? "pill-danger"
                          : "pill-warning"
                      )}
                    >
                      {c.severity} Severity
                    </span>
                    <span
                      className={cn(
                        "pill text-[10px] py-0.5",
                        c.status === "RESOLVED" || c.status === "CLOSED"
                          ? "pill-success"
                          : "pill-warning"
                      )}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{c.desc}</p>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-100/70 text-xs text-gray-400">
                  <div className="flex gap-4 flex-wrap">
                    <span>
                      Reporter: <strong>{c.reporter}</strong>
                    </span>
                    <span>Date: {c.date}</span>
                    <span>Type: {c.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      className="form-input text-[10px] py-1 px-2 w-auto"
                      value={c.status}
                      onChange={(e) => updateStatus(c.dbId, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <button
                      className="flex items-center gap-1 text-primary-700 font-semibold hover:underline"
                      onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                    >
                      <Eye className="h-3.5 w-3.5" /> Details
                    </button>
                  </div>
                </div>

                {expandedCase === c.id && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1">
                    <p>
                      <strong>Case ID:</strong> {c.id}
                    </p>
                    <p>
                      <strong>Status:</strong> {c.status.replace(/_/g, " ")}
                    </p>
                    <p>
                      <strong>Full description:</strong> {c.desc}
                    </p>
                    {c.evidenceNotes && (
                      <p>
                        <strong>Evidence notes:</strong> {c.evidenceNotes}
                      </p>
                    )}
                    {c.resolution && (
                      <p>
                        <strong>Resolution:</strong> {c.resolution}
                      </p>
                    )}
                    {c.auditLogs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {c.auditLogs.map((log, i) => (
                          <p key={i}>
                            {log.text} — {log.date}
                          </p>
                        ))}
                      </div>
                    )}
                    <Link
                      href="/institute/communication"
                      className="text-primary-700 font-semibold hover:underline inline-block mt-1"
                    >
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
