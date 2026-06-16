import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Save, Bell, Shield, Building, Key } from "lucide-react";

export const metadata = { title: "Settings - Institute Portal" };

export default async function InstituteSettingsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Institute Settings"
      breadcrumbs={[{ label: "Institute" }, { label: "Settings" }]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary-700" /> System Settings
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Configure default policies, academic schedules, and alerts</p>
          </div>
          <button className="btn-primary text-xs py-2">
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>

        {/* ── Settings Form ── */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Navigation panels */}
          <div className="space-y-3">
            {[
              { label: "Profile & Campus", icon: Building, active: true },
              { label: "Alerts & Notifications", icon: Bell, active: false },
              { label: "Safeguarding Policies", icon: Shield, active: false },
              { label: "Security & API Keys", icon: Key, active: false },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                    p.active ? "bg-primary text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50 border"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Configuration Forms */}
          <div className="md:col-span-2 space-y-6">
            <div className="dash-card p-6 bg-white space-y-5">
              <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Academic Parameters</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Current Academic Year</label>
                  <select className="form-input text-xs">
                    <option>2025 - 2026 (Active)</option>
                    <option>2026 - 2027</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hifz Tracking Rubric</label>
                  <select className="form-input text-xs">
                    <option>Juz-based Grid Map (Standard)</option>
                    <option>Page-based Checklist</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Daily Attendance Warning</label>
                  <input type="number" defaultValue={3} className="form-input text-xs" />
                  <span className="text-[10px] text-gray-400 mt-1 block">Consecutive missed days trigger alerts</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Primary Currency</label>
                  <select className="form-input text-xs">
                    <option>PKR (Rs.)</option>
                    <option>USD ($)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="dash-card p-6 bg-white space-y-5">
              <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Gateway Defaults</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Online Card Gateway</label>
                  <select className="form-input text-xs">
                    <option>Stripe Payments (Live)</option>
                    <option>Offline Bank Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Local Transfers (Stubs)</label>
                  <select className="form-input text-xs">
                    <option>JazzCash / Easypaisa Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
