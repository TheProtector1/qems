import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ParentFeeClaimButton } from "@/components/parent/parent-fee-claim-button";
import { ParentFeeReceiptButton } from "@/components/parent/parent-fee-receipt-button";
import type { FeeReceiptData } from "@/lib/fee-receipt-pdf";

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
      user: { select: { name: true, phone: true, email: true } },
      students: {
        include: {
          institute: { select: { name: true, phone: true, email: true, address: true, city: true } },
        },
      },
    },
  });

  const studentIds = parent?.students.map((s) => s.id) ?? [];
  const studentsMap = Object.fromEntries(parent?.students.map((s) => [s.id, s]) ?? []);
  const institute = parent?.students[0]?.institute;

  const payments = studentIds.length
    ? await prisma.feePayment.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
      })
    : [];

  const ledger = payments.map((p) => {
    const student = studentsMap[p.studentId];
    const receiptData: FeeReceiptData = {
      invoiceNo: p.invoiceNo,
      month: formatMonthLabel(p.month, p.dueDate),
      monthKey: p.month,
      amount: Number(p.netAmount),
      grossAmount: Number(p.amount),
      discount: Number(p.discount),
      currency: p.currency || institute?.currency || "PKR",
      dueDate: p.dueDate.toISOString().slice(0, 10),
      paidAt: p.paidAt ? p.paidAt.toISOString().slice(0, 10) : null,
      status: p.status,
      method: p.paymentMethod ? p.paymentMethod.replace(/_/g, " ") : null,
      paymentMethod: p.paymentMethod,
      notes: p.notes,
      student: {
        name: student?.fullName || "Student",
        studentId: student?.studentId || "",
        program: student?.programType,
        gender: student?.gender,
      },
      parent: {
        name: parent?.user?.name || "Parent",
        phone: parent?.user?.phone || "",
        email: parent?.user?.email || "",
      },
      institute: {
        name: institute?.name || "Islamic Institute",
        phone: institute?.phone || "",
        email: institute?.email || "",
        address: [institute?.address, institute?.city].filter(Boolean).join(", "),
        city: institute?.city || "",
      },
    };

    return {
      id: p.id,
      studentName: student?.fullName || "Student",
      month: formatMonthLabel(p.month, p.dueDate),
      amount: Number(p.netAmount),
      status: p.status === "PAID" ? "PAID" : p.status === "OVERDUE" ? "OVERDUE" : "DUE",
      claimStatus: p.claimStatus,
      dueDate: p.dueDate.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }),
      paidOn: p.paidAt
        ? p.paidAt.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })
        : null,
      receiptData,
    };
  });

  const totalDue = ledger.filter((l) => l.status === "DUE" || l.status === "OVERDUE").reduce((acc, curr) => acc + curr.amount, 0);
  const lastPaid = ledger.find((l) => l.status === "PAID");

  return (
    <DashboardShell
      title="Fees & Payments"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Fees & Payments" }]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900">Fee Ledger</h2>
          <p className="text-sm text-gray-500 mt-0.5">Tuition invoices & paid receipts for your enrolled children</p>
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
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Payment Options</p>
              <p className="font-display text-sm font-bold text-blue-700 mt-1">
                {institute?.phone ? `Call ${institute.phone}` : "See methods below"}
              </p>
            </div>
          </div>
        </div>

        {institute && (
          <div className="dash-card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">How to Pay</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pay {institute.name} using any of the methods below. Include your child&apos;s student ID in the payment reference.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "JazzCash", text: institute.phone ? `Send to ${institute.phone} via JazzCash and WhatsApp the receipt.` : "Contact the office for JazzCash details." },
                { title: "EasyPaisa", text: institute.phone ? `Transfer to ${institute.phone} with student ID in remarks.` : "Contact the office for EasyPaisa details." },
                { title: "Bank Transfer", text: `Email ${institute.email || "the institute"} for bank account details.` },
                { title: "Cash", text: institute.address ? `Pay at: ${[institute.address, institute.city].filter(Boolean).join(", ")}` : "Pay in person at the institute office." },
              ].map((m) => (
                <div key={m.title} className="rounded-xl border border-border p-4 bg-gray-50/50">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{m.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <th className="text-right">Action</th>
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
                          l.status === "PAID" ? "pill-success" : l.status === "OVERDUE" ? "pill-danger" : "pill-warning"
                        )}>
                          {l.claimStatus === "CLAIMED" ? "CLAIMED" : l.status}
                        </span>
                      </td>
                      <td>{l.dueDate}</td>
                      <td>{l.paidOn || "—"}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {l.status === "PAID" ? (
                            <ParentFeeReceiptButton receiptData={l.receiptData} />
                          ) : l.claimStatus !== "CLAIMED" ? (
                            <ParentFeeClaimButton feePaymentId={l.id} />
                          ) : null}
                        </div>
                      </td>
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
