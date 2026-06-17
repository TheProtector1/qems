import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ShieldAlert, MessageSquare, Search, Eye, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "Support Tickets - Super Admin Portal" };

const TICKETS = [
  { id: "TKT-8841", subject: "Stripe Webhook Failed", sender: "Dar ul Uloom Karachi", priority: "HIGH", status: "OPEN", date: "Today 08:30 AM" },
  { id: "TKT-8839", subject: "Cannot upload student profiles CSV", sender: "Al-Huda International", priority: "MEDIUM", status: "RESOLVED", date: "Yesterday" },
  { id: "TKT-8835", subject: "Attendance QR scan delays on mobile", sender: "Tajweed Academy UK", priority: "LOW", status: "RESOLVED", date: "2 days ago" },
];

export default async function AdminSupportPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Platform Support Tickets"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Support Tickets" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary-700" /> Support Desk
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Solve technical tickets and tenant queries</p>
        </div>

        {/* ── Search Bar ── */}
        <div className="dash-card p-4 bg-white flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search support tickets by ID or subject..."
              className="form-input pl-10 h-10 text-xs"
            />
          </div>
        </div>

        {/* ── Tickets List ── */}
        <div className="dash-card overflow-hidden bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Subject</th>
                <th>Tenant / sender</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reported On</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {TICKETS.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs font-bold text-primary-700">{t.id}</td>
                  <td className="font-semibold text-gray-900">{t.subject}</td>
                  <td><span className="text-xs text-gray-600">{t.sender}</span></td>
                  <td>
                    <span className={cn(
                      "pill text-[10px] py-0.5",
                      t.priority === "HIGH" && "pill-danger",
                      t.priority === "MEDIUM" && "pill-warning",
                      t.priority === "LOW" && "pill-info"
                    )}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={cn(
                      "pill text-[10px] py-0.5",
                      t.status === "OPEN" ? "pill-warning" : "pill-success"
                    )}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">{t.date}</td>
                  <td className="text-right">
                    <button className="flex items-center gap-1 ml-auto text-primary-700 font-semibold hover:underline text-xs">
                      <Eye className="h-3.5 w-3.5" /> Reply
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
