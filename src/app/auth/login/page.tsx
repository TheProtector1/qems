"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, BookOpen, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleResendVerification = async () => {
    if (!form.email) return;
    setResending(true);
    setResendStatus(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResendStatus({ success: false, message: data.error || "Failed to resend verification email." });
      } else {
        setResendStatus({ success: true, message: data.message || "Verification email sent!" });
      }
    } catch {
      setResendStatus({ success: false, message: "An unexpected error occurred. Please try again." });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendStatus(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email.toLowerCase(),
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero pattern-overlay flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.12),transparent_60%)]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white text-lg font-bold font-arabic">ق</span>
          </div>
          <span className="font-display text-2xl font-bold text-white">QEMS</span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <p className="arabic text-xl text-gold-light mb-8">
            وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
          </p>
          <h2 className="font-display text-4xl font-bold text-white mb-4 leading-tight">
            The World's Leading
            <br />
            <span className="text-gradient-gold">Quran Education</span>
            <br />
            Management System
          </h2>
          <p className="text-green-100/70 leading-relaxed max-w-md">
            Empowering Hifz institutes, Nazra academies, and Islamic schools
            to deliver excellence in Quran education — globally.
          </p>

          {/* Quick stats */}
          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { v: "500+", l: "Institutes" },
              { v: "10K+", l: "Students" },
              { v: "40+", l: "Countries" },
            ].map((s) => (
              <div key={s.l} className="glass-dark rounded-2xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-gradient-gold">{s.v}</p>
                <p className="text-green-100/60 text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 glass-dark rounded-2xl p-5">
          <p className="text-green-100 text-sm italic leading-relaxed">
            "QEMS has completely transformed how we manage our 300 huffaz.
            The Hifz tracking is exactly what we always needed."
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center">
              <span className="text-xs font-bold text-gray-900">MA</span>
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Mufti Asim Hafeez</p>
              <p className="text-green-200/60 text-xs">Director, Dar ul Uloom Karachi</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold font-arabic">ق</span>
            </div>
            <span className="font-display text-xl font-bold text-primary-900">QEMS</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-500 text-sm">
                Sign in to your QEMS account to continue
              </p>
            </div>

            {error && (
              <div className="mb-6 flex flex-col gap-2 rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                {error.toLowerCase().includes("verify your email") && (
                  <div className="mt-1 pl-8">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      className="text-xs font-semibold text-primary-700 hover:text-primary-950 underline disabled:opacity-50 text-left"
                    >
                      {resending ? "Resending..." : "Click here to resend verification email"}
                    </button>
                  </div>
                )}
                {resendStatus && (
                  <p className={`text-xs mt-1 pl-8 font-medium ${resendStatus.success ? "text-green-600" : "text-red-600"}`}>
                    {resendStatus.message}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@institute.com"
                  className="form-input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-primary-700 hover:text-primary-900 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password"
                    className="form-input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="btn-login"
                className="btn-primary w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" />
                    Signing in...
                  </>
                ) : (
                  "Sign In to QEMS"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link href="/auth/register" className="text-primary-700 font-semibold hover:text-primary-900">
                Register your institute
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 rounded-xl bg-primary-50 border border-primary-100 p-4">
              <p className="text-xs font-semibold text-primary-800 mb-2 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                Demo Credentials
              </p>
              <div className="space-y-1 text-xs text-primary-700 font-mono">
                <p>Super Admin: admin@qems.io / admin123</p>
                <p>Institute: owner@demo.com / demo123</p>
                <p>Teacher: teacher@demo.com / demo123</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
