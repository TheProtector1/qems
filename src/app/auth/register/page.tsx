"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Shield, Sparkles, Building2, User, Mail, Lock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    instituteName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }, 1500);
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
          Create Your Quran Institute
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link href="/auth/login" className="text-primary-700 font-semibold hover:text-primary-950">
            Sign In Here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Registration Submitted!</h3>
              <p className="text-sm text-gray-500">
                Your institute profile has been successfully set up. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                {/* Institute Name */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" /> Institute / Madrasah Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Tajweed Quran Academy"
                    value={form.instituteName}
                    onChange={(e) => setForm({ ...form, instituteName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" /> Owner / Admin Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Qari Bilal"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0300-1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="admin@academy.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-gray-400" /> Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-gray-400" /> Confirm Password
                  </label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* Agree checkbox */}
              <div className="flex items-center">
                <input
                  id="agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary-500"
                  required
                />
                <label htmlFor="agree" className="ml-2 block text-xs text-gray-500">
                  I agree to the{" "}
                  <Link href="/terms" className="underline hover:text-gray-700">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-gray-700">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  className="w-full btn-primary py-3 justify-center text-sm font-semibold shadow-md"
                  disabled={submitting}
                >
                  {submitting ? "Registering Institute..." : "Register Institute"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
