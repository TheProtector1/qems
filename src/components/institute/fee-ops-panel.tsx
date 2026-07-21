"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type Claim = {
  id: string;
  invoiceNo: string;
  studentName: string;
  studentCode: string;
  amount: number;
  method: string | null;
  reference: string | null;
  claimedAt: string | null;
};

export function FeeOpsPanel() {
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);

  const loadClaims = useCallback(async () => {
    setLoadingClaims(true);
    try {
      const res = await fetch("/api/institute/fees/ops");
      if (!res.ok) return;
      const data = await res.json();
      setClaims(data.claims || []);
    } finally {
      setLoadingClaims(false);
    }
  }, []);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/institute/fees/ops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      if (action === "remind") {
        toast.success(
          `Reminded ${data.reminded || 0} parents · marked ${data.markedOverdue || 0} overdue`
        );
      } else if (action === "mark-overdue") {
        toast.success(`Marked ${data.markedOverdue || 0} invoices overdue`);
      } else {
        toast.success("Updated");
        await loadClaims();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="dash-card p-5">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary-700" /> Fee automation
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Mark overdue invoices and send WhatsApp/SMS fee reminders to parents.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("mark-overdue")}
            className="btn-ghost text-xs py-2"
          >
            Mark overdue
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("remind", { onlyOverdue: true })}
            className="btn-primary text-xs py-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Remind overdue parents
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("remind", { onlyOverdue: false })}
            className="btn-ghost text-xs py-2"
          >
            Remind all unpaid
          </button>
        </div>
      </div>

      <div className="dash-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Payment claims</h3>
          <button type="button" className="btn-ghost text-xs py-1" onClick={loadClaims}>
            Refresh
          </button>
        </div>
        {loadingClaims ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No pending payment claims.</p>
        ) : (
          <div className="space-y-2">
            {claims.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-100 p-3 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {c.studentName} · {formatCurrency(c.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.invoiceNo} · {c.method || "—"}
                    {c.reference ? ` · ref ${c.reference}` : ""}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-ghost text-xs py-1.5 text-red-600"
                    onClick={() => run("resolve-claim", { feePaymentId: c.id, claimAction: "REJECT" })}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="btn-primary text-xs py-1.5"
                    onClick={() => run("resolve-claim", { feePaymentId: c.id, claimAction: "VERIFY" })}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verify paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
