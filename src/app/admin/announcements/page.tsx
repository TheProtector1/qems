import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Bell, Plus, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "System Announcements - Super Admin Portal" };

const SYSTEM_ANNOUNCEMENTS = [
  { id: "sa1", title: "Scheduled System Maintenance", target: "All Tenants", content: "QEMS will undergo scheduled database optimizations on June 20 at 02:00 AM UTC. Expect brief downtime.", date: "June 15, 2025", author: "Platform Ops" },
  { id: "sa2", title: "New Dashboard Visuals Released", target: "All Users", content: "We have released the new high-fidelity Arabic typography renders and Para maps on the student portal.", date: "June 10, 2025", author: "Product Team" },
];

export default async function AdminAnnouncementsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="System Announcements"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Announcements" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary-700" /> Platform-Wide Broadcasts
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Post global notifications and scheduled maintenance alerts to all accounts</p>
          </div>
          <Link href="/admin/announcements/new" className="btn-primary text-xs py-2">
            <Plus className="h-4 w-4" /> Create Broadcast
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-900">Broadcast Log</h3>
            <div className="space-y-3">
              {SYSTEM_ANNOUNCEMENTS.map((ann) => (
                <div key={ann.id} className="dash-card p-5 bg-white border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-950 text-base">{ann.title}</h4>
                    <span className="pill pill-primary text-[10px] py-0.5 px-2">{ann.target}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{ann.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span>Published by: <strong>{ann.author}</strong></span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card p-6 bg-amber-50/50 border border-amber-100 h-fit space-y-3">
            <div className="flex gap-2 text-amber-800 items-start">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Caution Before Posting</h4>
                <p className="text-xs text-amber-700 leading-relaxed mt-1">
                  Global announcements are pushed instantly to all logged-in users, tenant administrators, and child guardians. Please verify the date and spelling details before sending.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
