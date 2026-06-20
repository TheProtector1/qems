import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Fees & Payments - Parent Portal" };

function formatMonthLabel(month: string | null, dueDate: Date) {
  if (month) {
    const [y, m] = month.split("-");
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
  }
  return dueDate.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

export default async function ParentFeesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        select: { id: true, fullName: true, studentId: true },
      },
    },
  });

  const studentIds = parent?.students.map((s) => s.id) ?? [];
  const studentNames = Object.fromEntries(parent?.students.map((s) => [s.id, s.fullName]) ?? []);

  const payments = studentIds.length
    ? await prisma.feePayment.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const ledger = payments.map((p) => ({
    id: p.id,
    studentName: studentNames[p.studentId] || "Student",
    month: formatMonthLabel(p.month, p.dueDate),
    amount: Number(p.netAmount),
    status: p.status === "PAID" ? "PAID" : "DUE",
    dueDate: p.dueDate.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }),
    paidOn: p.paidAt
      ? p.paidAt.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })
      : null,
  }));

  const totalDue = ledger.filter((l) => l.status === "DUE").reduce((acc, curr) => acc + curr.amount, 0);
  const lastPaid = ledger.find((l) => l.status === "PAID");

  return (
    <DashboardShell
      title="Fees & Payments"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Fees & Payments" }]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900">Fee Ledger</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tuition invoices for your enrolled children</p>
        </div>

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
                {lastPaid ? formatCurrency(lastPaid.amount) : "—"}
              </p>
            </div>
          </div>

          <div className="dash-card p-6 bg-blue-50/50 border border-blue-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Online Payments</p>
              <p className="font-display text-sm font-bold text-blue-700 mt-1">Contact institute to pay</p>
            </div>
          </div>
        </div>

        <div className="dash-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-gray-900">Tuition History</h3>
          </div>
          {ledger.length === 0 ? (
            <div className="p-10 text-center text-gray-500 text-sm">No fee records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Month</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((l) => (
                    <tr key={l.id}>
                      <td className="font-medium text-gray-900">{l.studentName}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
