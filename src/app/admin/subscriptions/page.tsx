import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreditCard, Plus, ArrowUpRight, DollarSign, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Subscriptions - Super Admin Portal" };

const PLANS = [
  { id: "p1", name: "Starter Plan", price: 2500, period: "month", limit: "Up to 50 students", activeTenants: 12, features: ["Hifz Progress Matrix", "Basic Attendance", "Notice Board"] },
  { id: "p2", name: "Growth Plan", price: 5500, period: "month", limit: "Up to 250 students", activeTenants: 48, features: ["Multi-branch setup", "Assessments & Grading", "Stripe payment integration", "SMS notifications"] },
  { id: "p3", name: "Enterprise Plan", price: 12000, period: "month", limit: "Unlimited students", activeTenants: 15, features: ["Custom subdomain", "Audit trail logs", "Safeguarding reports", "Dedicated VIP QEMS Support", "Advanced Analytics"] },
];

export default async function AdminSubscriptionsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="SaaS Plans & Billing"
      breadcrumbs={[{ label: "Super Admin" }, { label: "Subscriptions" }]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-primary-700" /> Subscription Modules
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Define multi-tenant packages, features limits, and monthly prices</p>
          </div>
          <button className="btn-primary text-xs py-2">
            <Plus className="h-4 w-4" /> Add Plan
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className="dash-card p-6 flex flex-col justify-between bg-white border border-border">
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="font-display text-3xl font-bold text-primary-900">{formatCurrency(plan.price)}</span>
                  <span className="text-xs text-gray-400">/ {plan.period}</span>
                </div>
                <p className="text-xs text-primary-600 font-semibold mb-6">{plan.limit}</p>

                <div className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Active Tenants: <strong>{plan.activeTenants}</strong></span>
                <button className="btn-ghost text-[10px] py-1 px-3">Edit Plan</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
