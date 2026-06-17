"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Bell, ArrowLeft, CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    target: "ALL_INSTITUTES",
    content: "",
    severity: "INFO",
  });
  const [saved, setSaved] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/admin/announcements");
    }, 1500);
  };

  return (
    <DashboardShell
      title="Create Broadcast"
      breadcrumbs={[
        { label: "Super Admin", href: "/admin/dashboard" },
        { label: "Announcements", href: "/admin/announcements" },
        { label: "New Broadcast" }
      ]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <button
          onClick={() => router.push("/admin/announcements")}
          className="btn-ghost text-sm py-2 flex items-center gap-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Announcements
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dash-card p-8 bg-white">
            <h3 className="font-display text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-700" />
              Compose Broadcast Message
            </h3>

            <form onSubmit={handlePublish} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Broadcast Title</label>
                <input
                  type="text"
                  placeholder="e.g. Platform Version 1.4 Upgrade Notes"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Target Audience</label>
                  <select
                    value={form.target}
                    onChange={(e) => setForm({ ...form, target: e.target.value })}
                    className="form-input"
                  >
                    <option value="ALL_INSTITUTES">All Institutes (Owners)</option>
                    <option value="ALL_TEACHERS">All Quran Instructors</option>
                    <option value="ALL_PARENTS_STUDENTS">All Parents & Students</option>
                    <option value="ALL_USERS">All Users (System-wide)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Alert Level</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="form-input"
                  >
                    <option value="INFO">Information (Blue)</option>
                    <option value="SUCCESS">Feature Update (Green)</option>
                    <option value="WARNING">Maintenance Announcement (Yellow)</option>
                    <option value="CRITICAL">Critical Alert (Red)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Announcement Content</label>
                <textarea
                  placeholder="Write the full broadcast message..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="form-input resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => router.push("/admin/announcements")}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm py-2 px-5 flex items-center gap-2 justify-center"
                  disabled={saved}
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 animate-pulse" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Publish Broadcast
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="dash-card p-5 bg-amber-50 border border-amber-100">
              <div className="flex gap-2 text-amber-800 items-start">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Live Broadcast Notice</h4>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    This notification will appear instantly on the dashboards of the chosen target audience. Keep the messages concise, professional, and clear.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
