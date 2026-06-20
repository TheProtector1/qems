"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleHome: Record<string, string> = {
    SUPER_ADMIN: "/admin/dashboard",
    INSTITUTE_OWNER: "/institute/dashboard",
    BRANCH_MANAGER: "/branch/dashboard",
    TEACHER: "/teacher/dashboard",
    PARENT: "/parent/dashboard",
    STUDENT: "/student/dashboard",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to change password");
        return;
      }

      await update({ mustChangePassword: false });
      const home = roleHome[session?.user?.role || ""] || "/dashboard";
      router.push(home);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-white mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Change Your Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            For security, please set a new password before continuing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="dash-card p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="form-label">Current Password</label>
            <input
              type={showPass ? "text" : "password"}
              className="form-input"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                className="form-input pr-10"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              type={showPass ? "text" : "password"}
              className="form-input"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner className="h-4 w-4" /> : "Update Password"}
          </button>

          <p className="text-center text-xs text-gray-400">
            Need help? <Link href="/contact" className="text-green-700 hover:underline">Contact support</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
