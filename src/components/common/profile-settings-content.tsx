"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User, Lock, Loader2, CheckCircle2, Clock, AlertCircle, XCircle, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { approverLabel } from "@/lib/profile-approvals";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  mustChangePassword: boolean;
  institute?: { name: string } | null;
};

type PendingRequest = {
  id: string;
  requestedChanges: Record<string, string>;
  previousValues: Record<string, string | null>;
  status: string;
  approverType: string;
  createdAt: string;
};

export function ProfileSettingsContent() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [approverType, setApproverType] = useState<string | null>("INSTITUTE_OWNER");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data.profile);
      setPendingRequest(data.pendingRequest);
      setRequiresApproval(data.requiresApproval);
      setApproverType(data.approverType);
      setForm({
        name: data.profile.name || "",
        email: data.profile.email || "",
        phone: data.profile.phone || "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        return;
      }
      if (data.applied) {
        setMessage({ type: "success", text: "Profile updated successfully." });
        setPendingRequest(null);
      } else {
        setMessage({ type: "success", text: data.message || "Changes submitted for approval." });
        setPendingRequest(data.request);
      }
      await fetchProfile();
    } finally {
      setSaving(false);
    }
  };

  const cancelPending = async () => {
    const res = await fetch("/api/profile/change-requests", { method: "DELETE" });
    if (res.ok) {
      setPendingRequest(null);
      setMessage({ type: "success", text: "Pending request cancelled." });
      await fetchProfile();
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword || undefined,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage({ type: "error", text: data.error || "Failed to change password" });
        return;
      }
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (session?.user?.mustChangePassword) {
        await update({ mustChangePassword: false });
      }
      await fetchProfile();
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading profile…
      </div>
    );
  }

  const isParent = profile?.role === "PARENT";
  const forcedChange = profile?.mustChangePassword;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {forcedChange && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Password change required</p>
            <p className="text-xs text-amber-800 mt-1">
              You are using a temporary password. Please set a new password below before continuing.
              {isParent && " Your temporary password is the one shared by the institute (often parent123)."}
            </p>
            <Link href="/auth/change-password" className="text-xs font-semibold text-amber-900 underline mt-2 inline-block">
              Open dedicated password change screen →
            </Link>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6 text-primary-700" /> My Profile
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {profile?.institute?.name ? `${profile.institute.name} · ` : ""}
          {profile?.role?.replace(/_/g, " ")}
        </p>
      </div>

      {pendingRequest && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Pending approval</p>
                <p className="text-xs text-blue-800 mt-1">
                  Waiting for {approverLabel(pendingRequest.approverType as "INSTITUTE_OWNER" | "SUPER_ADMIN")} to review:
                </p>
                <ul className="text-xs text-blue-800 mt-2 space-y-0.5">
                  {Object.entries(pendingRequest.requestedChanges).map(([key, val]) => (
                    <li key={key}>
                      <span className="capitalize font-medium">{key}</span>: {String(val)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button type="button" onClick={cancelPending} className="text-xs text-blue-700 hover:underline flex-shrink-0">
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={submitProfile} className="dash-card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Account details</h3>

        {message && (
          <div className={cn(
            "flex items-center gap-2 rounded-lg p-3 text-sm",
            message.type === "success" ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
          )}>
            {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        {requiresApproval && !pendingRequest && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            Name, email, and phone changes require approval from your{" "}
            {approverType ? approverLabel(approverType as "INSTITUTE_OWNER" | "SUPER_ADMIN") : "administrator"}.
          </p>
        )}

        <div>
          <label className="form-label">Full name</label>
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            disabled={!!pendingRequest}
            required
          />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={!!pendingRequest}
            required
          />
          {isParent && (
            <p className="text-[11px] text-gray-400 mt-1">Optional for login — used for fee and attendance alerts.</p>
          )}
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input
            type="tel"
            className="form-input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            disabled={!!pendingRequest}
            placeholder="03001234567"
          />
          {isParent && (
            <p className="text-[11px] text-gray-400 mt-1">Parents sign in with this mobile number.</p>
          )}
        </div>

        <button type="submit" className="btn-primary text-sm py-2" disabled={saving || !!pendingRequest}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {requiresApproval ? "Submit for approval" : "Save changes"}
        </button>
      </form>

      <form onSubmit={changePassword} className="dash-card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 text-sm border-b pb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary-700" /> Password
        </h3>
        <p className="text-xs text-gray-500">Password changes take effect immediately — no approval needed.</p>

        {passwordMessage && (
          <div className={cn(
            "flex items-center gap-2 rounded-lg p-3 text-sm",
            passwordMessage.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
          )}>
            {passwordMessage.text}
          </div>
        )}

        {!forcedChange && (
          <div>
            <label className="form-label">Current password</label>
            <input
              type="password"
              className="form-input"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>
        )}
        {forcedChange && (
          <div>
            <label className="form-label">Temporary password (optional)</label>
            <input
              type="password"
              className="form-input"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="Enter if you want to verify the temporary password"
            />
          </div>
        )}
        <div>
          <label className="form-label">New password</label>
          <input
            type="password"
            className="form-input"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="form-label">Confirm new password</label>
          <input
            type="password"
            className="form-input"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn-primary text-sm py-2" disabled={passwordSaving}>
          {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Update password
        </button>
      </form>
    </div>
  );
}
