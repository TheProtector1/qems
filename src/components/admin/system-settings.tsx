"use client";

import { useState } from "react";
import {
  Settings, ToggleLeft, ToggleRight, Shield, Bell,
  Database, Globe, Mail, Smartphone, CreditCard,
  Save, RefreshCw, AlertTriangle, CheckCircle, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToggleSettingProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: React.ElementType;
  danger?: boolean;
}

function ToggleSetting({ label, description, value, onChange, icon: Icon, danger }: ToggleSettingProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
          danger ? "bg-red-50 text-red-600" : "bg-primary-50 text-primary-700"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className={cn("text-sm font-semibold", danger ? "text-red-700" : "text-gray-900")}>{label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0",
          value ? (danger ? "bg-red-500" : "bg-primary-600") : "bg-gray-200"
        )}
      >
        <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform",
          value ? "translate-x-6" : "translate-x-1"
        )} />
      </button>
    </div>
  );
}

export function AdminSystemSettings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    manualApproval: true,
    emailNotifications: true,
    maintenanceMode: false,
    publicRegistration: true,
    twoFactorAdmin: true,
    autoBackup: true,
    stripeTestMode: true,
    pushNotifications: false,
    auditLogging: true,
    rateLimiting: true,
  });

  const [emailConfig, setEmailConfig] = useState({
    smtpHost: "smtp.resend.com",
    smtpPort: "587",
    fromEmail: "noreply@qems.app",
    fromName: "QEMS Platform",
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary-700" /> System Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Global platform settings and feature controls</p>
        </div>
        <button
          onClick={handleSave}
          className={cn("btn-primary py-2 px-5 transition-all", saved && "bg-green-600 hover:bg-green-700")}
        >
          {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
        </button>
      </div>

      {/* Platform Features */}
      <div className="dash-card p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-primary-700" />
          <h3 className="font-semibold text-gray-900">Platform Controls</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Core platform behavior and access controls</p>
        <ToggleSetting
          label="Manual Institute Approval"
          description="New institutes require Super Admin approval before activation"
          value={settings.manualApproval}
          onChange={() => toggle("manualApproval")}
          icon={CheckCircle}
        />
        <ToggleSetting
          label="Public Institute Registration"
          description="Allow institutes to self-register via the public onboarding wizard"
          value={settings.publicRegistration}
          onChange={() => toggle("publicRegistration")}
          icon={Globe}
        />
        <ToggleSetting
          label="Maintenance Mode"
          description="Take the platform offline for all non-admin users"
          value={settings.maintenanceMode}
          onChange={() => toggle("maintenanceMode")}
          icon={Server}
          danger
        />
      </div>

      {/* Security */}
      <div className="dash-card p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary-700" />
          <h3 className="font-semibold text-gray-900">Security & Compliance</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Authentication, audit, and security features</p>
        <ToggleSetting
          label="Two-Factor Auth for Admins"
          description="Require 2FA for all Super Admin and Institute Owner accounts"
          value={settings.twoFactorAdmin}
          onChange={() => toggle("twoFactorAdmin")}
          icon={Shield}
        />
        <ToggleSetting
          label="Audit Logging"
          description="Record all administrative actions with user, timestamp, and IP"
          value={settings.auditLogging}
          onChange={() => toggle("auditLogging")}
          icon={Database}
        />
        <ToggleSetting
          label="API Rate Limiting"
          description="Throttle API requests to prevent abuse (100 req/min per tenant)"
          value={settings.rateLimiting}
          onChange={() => toggle("rateLimiting")}
          icon={Shield}
        />
      </div>

      {/* Notifications */}
      <div className="dash-card p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-5 w-5 text-primary-700" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Email and push notification configuration</p>
        <ToggleSetting
          label="Email Notifications"
          description="Send system emails (welcome, alerts, fee reminders, reports)"
          value={settings.emailNotifications}
          onChange={() => toggle("emailNotifications")}
          icon={Mail}
        />
        <ToggleSetting
          label="Push Notifications"
          description="Send Firebase push notifications to mobile devices"
          value={settings.pushNotifications}
          onChange={() => toggle("pushNotifications")}
          icon={Smartphone}
        />
      </div>

      {/* Email Config */}
      <div className="dash-card p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-primary-700" />
          <h3 className="font-semibold text-gray-900">Email Configuration (SMTP)</h3>
        </div>
        <p className="text-xs text-gray-400 mb-5">Configure the transactional email server</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="form-label" htmlFor="smtp-host">SMTP Host</label>
            <input id="smtp-host" className="form-input" value={emailConfig.smtpHost} onChange={(e) => setEmailConfig(p => ({ ...p, smtpHost: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="smtp-port">SMTP Port</label>
            <input id="smtp-port" className="form-input" value={emailConfig.smtpPort} onChange={(e) => setEmailConfig(p => ({ ...p, smtpPort: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="from-email">From Email</label>
            <input id="from-email" className="form-input" type="email" value={emailConfig.fromEmail} onChange={(e) => setEmailConfig(p => ({ ...p, fromEmail: e.target.value }))} />
          </div>
          <div>
            <label className="form-label" htmlFor="from-name">From Name</label>
            <input id="from-name" className="form-input" value={emailConfig.fromName} onChange={(e) => setEmailConfig(p => ({ ...p, fromName: e.target.value }))} />
          </div>
        </div>
        <button className="btn-ghost text-sm py-2 mt-4">
          <RefreshCw className="h-4 w-4" /> Test Email Connection
        </button>
      </div>

      {/* Payments */}
      <div className="dash-card p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-primary-700" />
          <h3 className="font-semibold text-gray-900">Payment Gateway</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Stripe integration mode and billing settings</p>
        <ToggleSetting
          label="Stripe Test Mode"
          description="Use Stripe test keys (no real charges). Toggle off for live production payments."
          value={settings.stripeTestMode}
          onChange={() => toggle("stripeTestMode")}
          icon={CreditCard}
          danger={!settings.stripeTestMode}
        />
        {!settings.stripeTestMode && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p><strong>Live Mode Active:</strong> Real payment charges are now enabled. Ensure your Stripe live keys are correctly configured in environment variables.</p>
          </div>
        )}
      </div>

      {/* Infrastructure */}
      <div className="dash-card p-6 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-primary-700" />
          <h3 className="font-semibold text-gray-900">Infrastructure</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Database and backup configuration</p>
        <ToggleSetting
          label="Automatic Daily Backups"
          description="Database snapshots retained for 30 days (Supabase managed)"
          value={settings.autoBackup}
          onChange={() => toggle("autoBackup")}
          icon={Database}
        />
        <div className="mt-4 grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          {[
            { label: "Database", value: "PostgreSQL 15", status: "Healthy" },
            { label: "Last Backup", value: "Today, 02:00 AM", status: "Success" },
            { label: "DB Storage", value: "2.4 GB / 10 GB", status: "Normal" },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-1">{s.value}</p>
              <span className="text-[10px] text-green-600 font-semibold">{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
