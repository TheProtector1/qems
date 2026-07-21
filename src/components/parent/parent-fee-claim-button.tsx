"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

const METHODS = [
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "EASYPAISA", label: "EasyPaisa" },
  { value: "RAAST", label: "Raast" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

export function ParentFeeClaimButton({
  feePaymentId,
  disabled,
}: {
  feePaymentId: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState("JAZZCASH");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/parent/fees/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feePaymentId, method, reference, note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Payment claim submitted — awaiting institute verification");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (disabled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary text-xs py-1.5 px-2.5"
      >
        <CreditCard className="h-3.5 w-3.5" /> I paid
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-3"
          >
            <h3 className="font-semibold text-gray-900">Report a payment</h3>
            <p className="text-xs text-gray-500">
              Tell the institute you paid. They will verify and mark the invoice settled.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Method</label>
              <select
                className="form-input text-xs"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Reference / TID</label>
              <input
                className="form-input text-xs"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Transaction ID"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Note (optional)</label>
              <input
                className="form-input text-xs"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-ghost flex-1 text-xs py-2" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 text-xs py-2" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit claim"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
