"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, User, Mail, Phone, Globe, MapPin, CreditCard,
  CheckCircle, ChevronRight, ChevronLeft, Loader2, AlertCircle,
  Shield, FileText, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const STEPS = [
  { id: 1, label: "Institute Info", icon: Building2 },
  { id: 2, label: "Director Details", icon: User },
  { id: 3, label: "Subscription Plan", icon: CreditCard },
  { id: 4, label: "Review & Create", icon: CheckCircle },
];

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    price: "Free",
    description: "Perfect for small institutes just getting started",
    features: ["Up to 50 students", "1 branch", "3 teachers", "Basic reporting", "Parent portal"],
    color: "border-gray-200 bg-white",
    badge: "",
    textColor: "text-gray-700",
  },
  {
    id: "GROWTH",
    name: "Growth",
    price: "PKR 4,999/mo",
    description: "For established institutes ready to scale",
    features: ["Up to 500 students", "5 branches", "25 teachers", "Advanced analytics", "Priority support", "Custom reports"],
    color: "border-primary-400 bg-primary-50/30",
    badge: "Most Popular",
    textColor: "text-primary-800",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    description: "For large chains with multiple campuses",
    features: ["Unlimited students", "Unlimited branches", "Unlimited teachers", "Dedicated account manager", "White-label option", "API access"],
    color: "border-amber-400 bg-amber-50/20",
    badge: "Premium",
    textColor: "text-amber-800",
  },
];

interface FormData {
  // Step 1
  name: string;
  slug: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  country: string;
  registrationNo: string;
  description: string;
  // Step 2
  directorName: string;
  directorEmail: string;
  directorPhone: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
  // Step 3
  plan: string;
}

const INITIAL_FORM: FormData = {
  name: "",
  slug: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  country: "PK",
  registrationNo: "",
  description: "",
  directorName: "",
  directorEmail: "",
  directorPhone: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  plan: "STARTER",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

export function CreateInstituteForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const update = (key: keyof FormData, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === "name") updated.slug = slugify(value);
      return updated;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/institutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create institute");
      setSuccess(true);
      setTimeout(() => router.push("/admin/institutes"), 1800);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-4 animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900">Institute Created!</h2>
        <p className="text-gray-500">
          <strong>{form.name}</strong> has been successfully registered and the owner account created.
        </p>
        <p className="text-sm text-gray-400">Redirecting to Institutes list…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="dash-card p-4 bg-white">
        <div className="flex items-center">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                    isDone ? "bg-primary-700 text-white" :
                    isActive ? "bg-primary-100 text-primary-800 ring-2 ring-primary-400 ring-offset-1" :
                    "bg-gray-100 text-gray-400"
                  )}>
                    {isDone ? <CheckCircle className="h-4.5 w-4.5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={cn(
                    "text-xs font-semibold hidden sm:block",
                    isActive ? "text-primary-800" : isDone ? "text-gray-700" : "text-gray-400"
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("flex-1 h-px mx-3 transition-colors", isDone ? "bg-primary-400" : "bg-gray-200")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="dash-card p-8 bg-white">
        {/* ── STEP 1: Institute Info ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-bold text-gray-900">Institute Information</h3>
              <p className="text-sm text-gray-500 mt-1">Basic details about the Quran institute</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="inst-name">Institute Full Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="inst-name" className="form-input pl-10" placeholder="e.g. Dar ul Uloom Karachi" value={form.name} onChange={(e) => update("name", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="inst-slug">URL Slug *</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="inst-slug" className="form-input pl-10 font-mono text-sm" placeholder="dar-ul-uloom-karachi" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} required />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Used in URLs. Auto-generated from name.</p>
              </div>
              <div>
                <label className="form-label" htmlFor="inst-regNo">Registration No.</label>
                <input id="inst-regNo" className="form-input" placeholder="e.g. WEF-2024-001" value={form.registrationNo} onChange={(e) => update("registrationNo", e.target.value)} />
              </div>
              <div>
                <label className="form-label" htmlFor="inst-email">Official Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="inst-email" className="form-input pl-10" type="email" placeholder="info@institute.edu" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="inst-phone">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="inst-phone" className="form-input pl-10" placeholder="+92 300 0000000" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="inst-website">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="inst-website" className="form-input pl-10" placeholder="https://institute.edu" value={form.website} onChange={(e) => update("website", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="inst-city">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input id="inst-city" className="form-input pl-10" placeholder="Karachi" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="inst-country">Country</label>
                <select id="inst-country" className="form-input" value={form.country} onChange={(e) => update("country", e.target.value)}>
                  <option value="PK">Pakistan</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="AE">UAE</option>
                  <option value="SA">Saudi Arabia</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="inst-address">Address</label>
                <input id="inst-address" className="form-input" placeholder="Full postal address" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="inst-desc">Description</label>
                <textarea id="inst-desc" className="form-input min-h-[80px] resize-none" placeholder="Brief description of the institute's mission and programs…" value={form.description} onChange={(e) => update("description", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Director + Owner Account ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-bold text-gray-900">Director & Owner Account</h3>
              <p className="text-sm text-gray-500 mt-1">Institute director details and platform login credentials</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">An <strong>Institute Owner</strong> account will be created with the email and password below. The owner will be able to log in and manage the institute immediately after creation.</p>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Director Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label" htmlFor="dir-name">Director Name</label>
                    <input id="dir-name" className="form-input" placeholder="Dr. Ahmed Khan" value={form.directorName} onChange={(e) => update("directorName", e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="dir-email">Director Email</label>
                    <input id="dir-email" className="form-input" type="email" placeholder="director@institute.edu" value={form.directorEmail} onChange={(e) => update("directorEmail", e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="dir-phone">Director Phone</label>
                    <input id="dir-phone" className="form-input" placeholder="+92 300 0000000" value={form.directorPhone} onChange={(e) => update("directorPhone", e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Platform Owner Account</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label" htmlFor="own-name">Owner Full Name *</label>
                    <input id="own-name" className="form-input" placeholder="Mohammad Ali" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} required />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="own-email">Owner Login Email *</label>
                    <input id="own-email" className="form-input" type="email" placeholder="owner@institute.edu" value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label" htmlFor="own-pass">Temporary Password *</label>
                    <input id="own-pass" className="form-input font-mono" type="password" placeholder="Min. 8 characters" value={form.ownerPassword} onChange={(e) => update("ownerPassword", e.target.value)} required />
                    <p className="text-[11px] text-gray-400 mt-1">Owner should change this on first login.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Subscription Plan ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-bold text-gray-900">Select Subscription Plan</h3>
              <p className="text-sm text-gray-500 mt-1">Choose the plan that fits the institute&apos;s scale</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => update("plan", plan.id)}
                  className={cn(
                    "text-left p-5 rounded-2xl border-2 transition-all duration-200 relative",
                    form.plan === plan.id ? plan.color + " shadow-md scale-[1.02]" : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  {plan.badge && (
                    <span className={cn("absolute -top-2.5 left-4 text-[10px] font-bold px-2.5 py-0.5 rounded-full",
                      plan.id === "GROWTH" ? "bg-primary-700 text-white" : "bg-amber-500 text-white"
                    )}>{plan.badge}</span>
                  )}
                  {form.plan === plan.id && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary-700 flex items-center justify-center">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <h4 className={cn("font-display text-lg font-bold", form.plan === plan.id ? plan.textColor : "text-gray-900")}>{plan.name}</h4>
                  <p className="text-xl font-bold text-gray-900 mt-1">{plan.price}</p>
                  <p className="text-xs text-gray-500 mt-2 mb-4">{plan.description}</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-xl font-bold text-gray-900">Review & Confirm</h3>
              <p className="text-sm text-gray-500 mt-1">Verify all details before creating the institute</p>
            </div>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-primary-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Institute</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Name:</span> <span className="font-semibold ml-1 text-gray-900">{form.name || "—"}</span></div>
                  <div><span className="text-gray-400">Slug:</span> <span className="font-mono ml-1 text-gray-700">{form.slug || "—"}</span></div>
                  <div><span className="text-gray-400">Email:</span> <span className="ml-1 text-gray-700">{form.email || "—"}</span></div>
                  <div><span className="text-gray-400">City:</span> <span className="ml-1 text-gray-700">{form.city || "—"}</span></div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-primary-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Owner Account</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Name:</span> <span className="font-semibold ml-1 text-gray-900">{form.ownerName || "—"}</span></div>
                  <div><span className="text-gray-400">Email:</span> <span className="ml-1 text-gray-700">{form.ownerEmail || "—"}</span></div>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary-700" />
                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Plan</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("pill text-sm",
                    form.plan === "GROWTH" ? "pill-success" :
                    form.plan === "ENTERPRISE" ? "pill-gold" : "pill-info"
                  )}>{form.plan}</span>
                  <span className="text-sm text-gray-500">{PLANS.find(p => p.id === form.plan)?.price}</span>
                </div>
              </div>
            </div>
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="btn-ghost py-2.5 px-5">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Link href="/admin/institutes" className="btn-ghost py-2.5 px-5">Cancel</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Step {step} of {STEPS.length}</span>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!form.name || !form.slug || !form.email)) ||
                (step === 2 && (!form.ownerName || !form.ownerEmail || !form.ownerPassword))
              }
              className="btn-primary py-2.5 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary py-2.5 px-8"
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><CheckCircle className="h-4 w-4" /> Create Institute</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
