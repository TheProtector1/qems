"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { FeeReceiptModal } from "@/components/institute/fee-receipt-modal";
import type { FeeReceiptData } from "@/lib/fee-receipt-pdf";

interface ParentFeeReceiptButtonProps {
  receiptData: FeeReceiptData;
}

export function ParentFeeReceiptButton({ receiptData }: ParentFeeReceiptButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-green-50 text-green-800 hover:bg-green-100 border border-green-200 text-xs font-semibold shadow-2xs transition"
        title="View & Download Official Paid Receipt"
      >
        <FileText className="h-3.5 w-3.5" />
        Receipt
      </button>

      {open && (
        <FeeReceiptModal
          receiptData={receiptData}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
