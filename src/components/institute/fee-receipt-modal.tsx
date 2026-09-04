"use client";

import { useState } from "react";
import {
  Download, Printer, Share2, CheckCircle2, X, FileText,
  Building2, User, CreditCard, Copy, Check
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { generateFeeReceiptPdf, type FeeReceiptData } from "@/lib/fee-receipt-pdf";

interface FeeReceiptModalProps {
  receiptData: FeeReceiptData;
  onClose: () => void;
}

export function FeeReceiptModal({ receiptData, onClose }: FeeReceiptModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPaid = receiptData.status === "PAID";
  const isWaived = receiptData.status === "WAIVED";
  const currency = receiptData.currency || "PKR";
  const gross = receiptData.grossAmount ?? receiptData.amount;
  const discount = receiptData.discount ?? 0;
  const net = receiptData.amount;

  const handleDownloadPdf = () => {
    try {
      setDownloading(true);
      const doc = generateFeeReceiptPdf(receiptData);
      const safeInvoice = (receiptData.invoiceNo || "receipt").replace(/[^a-zA-Z0-9-_]/g, "_");
      const safeStudent = (receiptData.student.name || "student").replace(/[^a-zA-Z0-9-_]/g, "_");
      doc.save(`Fee_Receipt_${safeInvoice}_${safeStudent}.pdf`);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const parentName = receiptData.parent?.name || "Respected Parent";
    const studentName = receiptData.student.name;
    const inv = receiptData.invoiceNo;
    const month = receiptData.month;
    const paidDate = receiptData.paidAt
      ? new Date(receiptData.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
      : "Today";
    const method = receiptData.method || (receiptData.paymentMethod ? receiptData.paymentMethod.replace(/_/g, " ") : "Cash");

    return `*${receiptData.institute.name.toUpperCase()} - FEE RECEIPT*\n` +
      `السلام عليكم ورحمة الله وبركاته,\n\n` +
      `Dear ${parentName},\n` +
      `This is to confirm that the tuition fee for *${studentName}* has been received.\n\n` +
      `📄 *Invoice No:* ${inv}\n` +
      `📅 *Month:* ${month}\n` +
      `💰 *Amount Paid:* ${currency} ${net.toLocaleString()}\n` +
      `💳 *Payment Method:* ${method}\n` +
      `✅ *Payment Date:* ${paidDate}\n` +
      `🏷️ *Status:* PAID\n\n` +
      `جزاكم الله خيرا for your continued support and prompt payment.\n` +
      `_${receiptData.institute.name}_`;
  };

  const handleShareWhatsApp = () => {
    const msg = generateWhatsAppMessage();
    const phone = receiptData.parent?.phone ? receiptData.parent.phone.replace(/[^0-9]/g, "") : "";
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = async () => {
    const msg = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden my-6 border border-gray-100 print:shadow-none print:border-none print:max-w-none print:my-0">
        
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Fee Receipt & Invoice</h3>
              <p className="text-[11px] text-gray-500">{receiptData.invoiceNo} · {receiptData.month}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
              title="Share receipt summary via WhatsApp to parent"
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition"
              title="Copy receipt summary"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium transition"
              title="Print Receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-800 text-white hover:bg-primary-900 text-xs font-semibold shadow-sm transition"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Generating..." : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-6 md:p-8 space-y-6 bg-white text-gray-900" id="printable-receipt">
          
          {/* Institute Header */}
          <div className="text-center pb-5 border-b border-gray-200 relative">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-green-700 to-emerald-900 text-white font-bold text-lg mb-2 shadow-sm">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-gray-900 tracking-tight">
              {receiptData.institute.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {[
                receiptData.institute.address,
                receiptData.institute.city,
                receiptData.institute.phone ? `Tel: ${receiptData.institute.phone}` : null,
                receiptData.institute.email ? `Email: ${receiptData.institute.email}` : null,
              ].filter(Boolean).join(" · ")}
            </p>

            {/* Receipt Title Banner */}
            <div className="mt-4 py-1.5 px-4 bg-green-50/80 border border-green-200/60 rounded-xl inline-block">
              <span className="text-xs font-bold uppercase tracking-wider text-green-900">
                Official Tuition Fee Receipt
              </span>
            </div>
          </div>

          {/* Receipt Key Metadata & Status Stamp */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
            <div>
              <span className="text-gray-400 font-medium block">Invoice / Receipt #:</span>
              <span className="font-mono font-bold text-gray-900 text-sm">{receiptData.invoiceNo}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Billing Month:</span>
              <span className="font-semibold text-gray-900 text-sm">{receiptData.month}</span>
            </div>
            <div className="col-span-2 md:col-span-1 flex md:justify-end items-center">
              <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold text-xs ${
                isPaid
                  ? "bg-green-100/80 text-green-800 border-green-300"
                  : isWaived
                  ? "bg-blue-100/80 text-blue-800 border-blue-300"
                  : "bg-amber-100/80 text-amber-800 border-amber-300"
              }`}>
                <CheckCircle2 className="h-4 w-4" />
                <span>{isPaid ? "PAID" : isWaived ? "100% SCHOLARSHIP" : receiptData.status}</span>
              </div>
            </div>
          </div>

          {/* Student & Parent Information Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-green-800 font-semibold text-xs">
                <User className="h-3.5 w-3.5" />
                <span>Student Details</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <span className="text-gray-500">Full Name:</span>
                <span className="col-span-2 font-semibold text-gray-900">{receiptData.student.name}</span>
                
                <span className="text-gray-500">Student ID:</span>
                <span className="col-span-2 font-mono text-gray-700">{receiptData.student.studentId}</span>
                
                <span className="text-gray-500">Program:</span>
                <span className="col-span-2 text-gray-700">{receiptData.student.program || "Quran Studies"}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-green-800 font-semibold text-xs">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Parent & Payment Info</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <span className="text-gray-500">Father / Parent:</span>
                <span className="col-span-2 font-semibold text-gray-900">{receiptData.parent?.name || "Parent"}</span>
                
                <span className="text-gray-500">Contact Phone:</span>
                <span className="col-span-2 text-gray-700">{receiptData.parent?.phone || "—"}</span>
                
                <span className="text-gray-500">Method:</span>
                <span className="col-span-2 font-medium text-gray-800">
                  {receiptData.method || (receiptData.paymentMethod ? receiptData.paymentMethod.replace(/_/g, " ") : isPaid ? "Cash" : "—")}
                  {receiptData.sponsorName ? ` (via ${receiptData.sponsorName})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Description / Particulars</th>
                  <th className="py-2.5 px-4 text-right">Gross Amount</th>
                  <th className="py-2.5 px-4 text-right">Concession / Discount</th>
                  <th className="py-2.5 px-4 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-4 text-center text-gray-400">1</td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    Tuition Fee — {receiptData.month}
                    <span className="block text-[10px] text-gray-400">
                      {receiptData.student.name} ({receiptData.student.program || "Quran Studies"})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(gross)}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-medium">
                    {discount > 0 ? `- ${formatCurrency(discount)}` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(net)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-green-50/60 border-t border-green-200 font-bold">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-right text-green-900 uppercase tracking-wider text-[11px]">
                    Total Amount Paid:
                  </td>
                  <td className="py-3 px-4 text-right text-base text-green-950 font-display">
                    {formatCurrency(net)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Notes & Recorded Date */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1">
            <p className="font-semibold text-gray-700">Remarks / Transaction Details:</p>
            <p className="text-gray-500">
              {receiptData.notes || (isPaid ? "Payment received and reconciled into the QEMS financial ledger." : "Pending receipt clearance.")}
            </p>
            {receiptData.paidAt && (
              <p className="text-[11px] text-gray-400 pt-1">
                Settled Date: {new Date(receiptData.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Signatures & Footer Note */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-gray-400 border-t border-gray-100">
            <div>
              <div className="border-b border-gray-300 w-36 mx-auto mb-1.5" />
              <p className="font-medium text-gray-600">Cashier / Staff</p>
            </div>
            <div>
              <div className="border-b border-gray-300 w-36 mx-auto mb-1.5" />
              <p className="font-medium text-gray-600">Authorized Signature & Stamp</p>
            </div>
          </div>

          <div className="text-center pt-2 text-[11px] text-gray-400">
            <p className="font-semibold text-green-800">
              جَزَاكُمُ اللَّهُ خَيْرًا — JazakAllahu Khairan for supporting your child&apos;s Quranic education.
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              This is a verified computer-generated receipt from QEMS.
            </p>
          </div>
        </div>

        {/* Bottom Actions Bar (Hidden on print) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between print:hidden">
          <p className="text-xs text-gray-500">
            Need to send this receipt to the parent? Use <span className="font-semibold text-emerald-700">WhatsApp</span> or download the PDF.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="btn-ghost text-xs py-2 text-emerald-700 hover:bg-emerald-50"
            >
              <Share2 className="h-3.5 w-3.5 mr-1" />
              WhatsApp to Parent
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="btn-primary text-xs py-2"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              {downloading ? "Downloading..." : "Download Official PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
