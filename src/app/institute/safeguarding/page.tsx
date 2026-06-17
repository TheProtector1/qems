import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
<<<<<<< HEAD
import { SafeguardingPageContent } from "@/components/institute/safeguarding-page-content";

export const metadata = { title: "Safeguarding & Protection - QEMS" };

=======
import { ShieldAlert, Plus, Eye, CheckCircle, ShieldCheck, History, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Safeguarding & Protection - QEMS" };

const CASES = [
  { id: "CASE-2025-001", student: "Usman Ali", reporter: "Qari Saheb", type: "Bullying", severity: "Medium", status: "RESOLVED", date: "June 10, 2025", desc: "Verbal conflict between students during break." },
  { id: "CASE-2025-002", student: "Aisha Siddiqa", reporter: "Qari Hamid", type: "Behavioral Change", severity: "High", status: "UNDER_INVESTIGATION", date: "June 14, 2025", desc: "Sudden drop in student participation and consistent absence." },
];

>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
export default async function InstituteSafeguardingPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Safeguarding & Child Protection"
      breadcrumbs={[{ label: "Institute" }, { label: "Safeguarding" }]}
    >
<<<<<<< HEAD
      <SafeguardingPageContent />
=======
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary-700" /> Safeguarding Center
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Report incidents, track compliance cases, and view protection logs</p>
          </div>
          <button className="btn-primary text-xs py-2">
            <Plus className="h-4 w-4" /> Report Incident
          </button>
        </div>

        {/* ── Overview ── */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="dash-card p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-xs text-green-100 font-semibold uppercase">Compliance Status</p>
              <p className="font-display text-2xl font-bold mt-1">100% Compliant</p>
            </div>
            <ShieldCheck className="h-10 w-10 text-green-100 opacity-80" />
          </div>

          <div className="dash-card p-5 bg-amber-50 border border-amber-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase">Active Cases</p>
              <p className="font-display text-2xl font-bold text-amber-700 mt-1">1 Case Open</p>
            </div>
            <AlertTriangle className="h-10 w-10 text-amber-500 opacity-80" />
          </div>

          <div className="dash-card p-5 bg-blue-50 border border-blue-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Resolved (YTD)</p>
              <p className="font-display text-2xl font-bold text-blue-700 mt-1">8 Cases</p>
            </div>
            <CheckCircle className="h-10 w-10 text-blue-500 opacity-80" />
          </div>
        </div>

        {/* ── Active Cases Tracker ── */}
        <div className="dash-card overflow-hidden bg-white">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-gray-900">Incident Registry</h3>
          </div>
          <div className="divide-y divide-border">
            {CASES.map((c) => (
              <div key={c.id} className="p-5 hover:bg-gray-50/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                      {c.id}
                    </span>
                    <h4 className="font-semibold text-gray-900 text-sm">Student: {c.student}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "pill text-[10px] py-0.5",
                      c.severity === "High" ? "pill-danger" : "pill-warning"
                    )}>
                      {c.severity} Severity
                    </span>
                    <span className={cn(
                      "pill text-[10px] py-0.5",
                      c.status === "RESOLVED" ? "pill-success" : "pill-warning"
                    )}>
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
                  <button className="flex items-center gap-1 text-primary-700 font-semibold hover:underline">
                    <Eye className="h-3.5 w-3.5" /> View Logs
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Audit Trail Block ── */}
        <div className="dash-card p-6 bg-white">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-gray-400" /> Immutable Action Logs
          </h3>
          <div className="space-y-4">
            {[
              { text: "Case CASE-2025-002: Status updated to UNDER_INVESTIGATION by Owner", date: "June 14, 2025 10:30 AM" },
              { text: "Case CASE-2025-001: Resolution comments uploaded. Closed by Admin", date: "June 12, 2025 04:15 PM" },
              { text: "System Policy: Safeguarding Handbook version 2.1 successfully deployed", date: "June 01, 2025 09:00 AM" },
            ].map((log, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                <span className="h-2 w-2 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-700">{log.text}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{log.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
>>>>>>> 69c1b278484f624f04044e45de8438706888ccac
    </DashboardShell>
  );
}
