"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900">Invalid Link</h2>
          <p className="text-gray-500 mt-2">The password reset link is invalid or missing the token.</p>
          <Link href="/auth/forgot-password" className="mt-4 btn-primary inline-flex">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-green">
            <span className="text-white text-xl font-bold font-arabic">ق</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-display font-extrabold text-gray-900">
          Set New Password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Password Reset!</h3>
              <p className="text-sm text-gray-500">
                Your password has been changed successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-gray-400" /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    className="form-input pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-gray-400" /> Confirm New Password
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3 justify-center text-sm font-semibold shadow-md"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
