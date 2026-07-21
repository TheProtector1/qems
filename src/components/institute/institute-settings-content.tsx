"use client";

import Link from "next/link";
import { useState } from "react";
import { Settings, Save, Bell, Shield, Building, Key, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PANELS = [
  { label: "Profile & Campus", icon: Building, id: "profile" },
  { label: "Alerts & Notifications", icon: Bell, id: "alerts" },
  { label: "Safeguarding Policies", icon: Shield, id: "safeguarding" },
  { label: "Security & Backup", icon: Key, id: "security" },
] as const;

export function InstituteSettingsContent() {
  const [activePanel, setActivePanel] = useState<string>("profile");
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/institute/export");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `qems-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary-700" /> System Settings
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Configure default policies, academic schedules, and alerts</p>
        </div>
        <button className="btn-primary text-xs py-2" onClick={handleSave}>
          <Save className="h-4 w-4" /> {saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="space-y-3">
          {PANELS.map((p) => {
            const Icon = p.icon;
            const isActive = activePanel === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePanel(p.id)}
                className={`w-full text-left p-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors ${
                  isActive ? "bg-primary text-white shadow-md" : "bg-white text-gray-700 hover:bg-gray-50 border"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2 space-y-6">
          {activePanel === "profile" && (
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
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fee Due Day (Monthly)</label>
                  <input type="number" defaultValue={10} className="form-input text-xs" />
                </div>
              </div>
            </div>
          )}

          {activePanel === "alerts" && (
            <div className="dash-card p-6 bg-white space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Alerts & Notifications</h3>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="rounded" />
                Email parents when attendance drops below 80%
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="rounded" />
                Notify institute owner of overdue fees
              </label>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" className="rounded" />
                SMS reminders for fee collection
              </label>
            </div>
          )}

          {activePanel === "safeguarding" && (
            <div className="dash-card p-6 bg-white space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Safeguarding Policies</h3>
              <p className="text-sm text-gray-600">Configure mandatory reporting workflows and compliance checklists for your institute.</p>
              <Link href="/institute/safeguarding" className="btn-ghost text-xs py-2 inline-flex w-auto">
                Open Safeguarding Center
              </Link>
            </div>
          )}

          {activePanel === "security" && (
            <div className="dash-card p-6 bg-white space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Security & Backup</h3>
              <p className="text-sm text-gray-600">
                Download a JSON archive of students, classes, fees, attendance, and safeguarding metadata (no password hashes or document blobs).
              </p>
              <button
                type="button"
                className="btn-primary text-xs py-2 inline-flex"
                disabled={exporting}
                onClick={handleExport}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {exporting ? "Preparing…" : "Download data backup"}
              </button>
              <button
                type="button"
                className="btn-ghost text-xs py-2"
                onClick={() => alert("API key rotation is managed by your system administrator.")}
              >
                Rotate API Keys
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
