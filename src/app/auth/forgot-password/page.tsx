"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }
      setSubmitted(true);
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
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Remembered your credentials?{" "}
          <Link href="/auth/login" className="text-primary-700 font-semibold hover:text-primary-950">
            Login Here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="h-10 w-10 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Recovery Email Sent</h3>
              <p className="text-sm text-gray-500">
                We have emailed a secure reset link to <strong>{email}</strong>. Please check your inbox.
              </p>
              <div className="pt-4">
                <Link href="/auth/login" className="btn-ghost inline-flex items-center gap-2 text-xs">
                  <ArrowLeft className="h-4 w-4" /> Return to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> Account Email Address
                </label>
                <input
                  type="email"
                  placeholder="admin@academy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3 justify-center text-sm font-semibold shadow-md"
                  disabled={submitting}
                >
                  {submitting ? "Sending Link..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
