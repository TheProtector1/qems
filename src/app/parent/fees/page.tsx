import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DollarSign, CheckCircle2, AlertCircle, CreditCard, Lock } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Fees & Payments - Parent Portal" };

const LEDGER = [
  { id: "f1", month: "June 2025", amount: 3500, status: "DUE", dueDate: "June 25, 2025", paidOn: null },
  { id: "f2", month: "May 2025", amount: 3500, status: "PAID", dueDate: "May 25, 2025", paidOn: "May 2, 2025" },
  { id: "f3", month: "April 2025", amount: 3500, status: "PAID", dueDate: "April 25, 2025", paidOn: "April 1, 2025" },
];

export default async function ParentFeesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const totalDue = LEDGER.filter((l) => l.status === "DUE").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DashboardShell
      title="Fees & Payments"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Fees & Payments" }]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900">Fee Ledger</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage tuition payments and transaction history</p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="dash-card p-6 bg-red-50/50 border border-red-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-red-600 font-semibold uppercase tracking-wider">Outstanding Dues</p>
              <p className="font-display text-2xl font-bold text-red-700 mt-0.5">
                {formatCurrency(totalDue)}
              </p>
            </div>
          </div>

          <div className="dash-card p-6 bg-green-50/50 border border-green-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Last Paid Amount</p>
              <p className="font-display text-2xl font-bold text-green-700 mt-0.5">
                {formatCurrency(3500)}
              </p>
            </div>
          </div>

          <div className="dash-card p-6 bg-blue-50/50 border border-blue-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Payment Method</p>
              <p className="font-display text-lg font-bold text-blue-700 mt-1 flex items-center gap-1">
                Stripe Card <Lock className="h-4 w-4 text-blue-400" />
              </p>
            </div>
          </div>
        </div>

        {/* ── Dues Ledger Table ── */}
        <div className="dash-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-gray-900">Tuition History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Paid Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER.map((l) => (
                  <tr key={l.id}>
                    <td className="font-semibold text-gray-900">{l.month}</td>
                    <td className="font-semibold">{formatCurrency(l.amount)}</td>
                    <td>
                      <span className={cn(
                        "pill text-[10px] py-0.5",
                        l.status === "PAID" ? "pill-success" : "pill-danger"
                      )}>
                        {l.status}
                      </span>
                    </td>
                    <td>{l.dueDate}</td>
                    <td>{l.paidOn || "—"}</td>
                    <td className="text-right">
                      {l.status === "DUE" ? (
                        <button
                          className="btn-primary text-xs py-1.5 px-4"
                          id="btn-parent-pay-online"
                        >
                          Pay Online
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
