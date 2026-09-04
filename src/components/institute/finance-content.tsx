"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  DollarSign, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Download, Plus, Search, CreditCard, Loader2, Pencil, Trash2,
  FileText, Calendar, Filter, RefreshCw, AlertTriangle
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn, formatCurrency, getInitials, downloadCsv } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { FeeReceiptModal } from "@/components/institute/fee-receipt-modal";
import type { FeeReceiptData } from "@/lib/fee-receipt-pdf";

type FeeRow = {
  id: string;
  invoiceNo: string;
  studentDbId?: string;
  student: string;
  studentId: string;
  gender?: string;
  program: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  month: string;
  monthKey?: string | null;
  amount: number;
  grossAmount?: number;
  discount?: number;
  currency?: string;
  dueDate?: string;
  notes?: string | null;
  status: string;
  paidAt: string | null;
  method: string | null;
  paymentMethod?: string | null;
  sponsorId?: string | null;
  sponsorName?: string | null;
  availableSponsors?: Array<{ id: string; name: string; balance?: number }>;
};

type SponsorOption = { id: string; name: string; balance: number };

type InstituteInfo = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  logo?: string | null;
  currency?: string;
};

const statusConfig: Record<string, { label: string; pill: string; icon: React.ElementType }> = {
  PAID: { label: "Paid", pill: "pill-success", icon: CheckCircle2 },
  PENDING: { label: "Pending", pill: "pill-warning", icon: Clock },
  OVERDUE: { label: "Overdue", pill: "pill-danger", icon: AlertCircle },
  PARTIAL: { label: "Partial", pill: "pill-warning", icon: Clock },
  WAIVED: { label: "100% Scholarship", pill: "pill-info", icon: CheckCircle2 },
};

function formatMonthOption(mKey: string) {
  const [y, m] = mKey.split("-").map(Number);
  if (!y || !m) return mKey;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function FinanceContent() {
  const { data: session } = useSession();
  const canEditFees =
    session?.user?.role === "INSTITUTE_OWNER" || session?.user?.role === "SUPER_ADMIN";

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [distinctMonths, setDistinctMonths] = useState<string[]>([]);
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [instituteInfo, setInstituteInfo] = useState<InstituteInfo>({ name: "Institute" });
  const [summary, setSummary] = useState<{
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    scholarshipCount: number;
    revenueData: { month: string; monthKey?: string; collected: number; outstanding: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Billing Panel & Generation
  const [showBillingPanel, setShowBillingPanel] = useState(false);
  const [structures, setStructures] = useState<Array<{
    id: string; name: string; programType: string | null; amount: number; frequency: string; isActive: boolean;
  }>>([]);
  const [billingMonth, setBillingMonth] = useState(currentMonth);
  const [billingDueDay, setBillingDueDay] = useState("10");
  const [billingFallback, setBillingFallback] = useState("5000");
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingSuccessMessage, setBillingSuccessMessage] = useState<string | null>(null);

  // Fee Structures
  const [structureForm, setStructureForm] = useState({ name: "", programType: "HIFZ", amount: "5000" });
  const [structureSaving, setStructureSaving] = useState(false);

  // Collect Payment Modal
  const [collectModal, setCollectModal] = useState<FeeRow | null>(null);
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectPaidAt, setCollectPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [collectNotes, setCollectNotes] = useState("");
  const [collectPayer, setCollectPayer] = useState<"DIRECT" | "SPONSOR">("DIRECT");
  const [collectSponsorId, setCollectSponsorId] = useState("");
  const [collectSaving, setCollectSaving] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);

  // Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<FeeReceiptData | null>(null);

  // Edit Fee Modal
  const [editModal, setEditModal] = useState<FeeRow | null>(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    discount: "",
    netAmount: "",
    dueDate: "",
    month: "",
    status: "PENDING",
    paymentMethod: "",
    paidAt: "",
    notes: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<FeeRow | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // Clear Batch Modal
  const [showClearBatchModal, setShowClearBatchModal] = useState(false);
  const [clearBatchMonth, setClearBatchMonth] = useState("ALL");
  const [clearBatchSaving, setClearBatchSaving] = useState(false);

  const loadStructures = useCallback(async () => {
    try {
      const res = await fetch("/api/institute/fee-structures");
      if (res.ok) {
        const data = await res.json();
        setStructures(data.structures || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ summary: "true", limit: "200" });
      if (monthFilter && monthFilter !== "ALL") {
        params.set("month", monthFilter);
      }
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/institute/fees?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load fees");
      const data = await res.json();
      setFees(data.fees || []);
      setDistinctMonths(data.distinctMonths || []);
      setInstituteInfo(data.institute || { name: "Institute" });
      setSponsors(data.sponsors || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
      setFees([]);
      setSponsors([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [monthFilter, statusFilter, search]);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  useEffect(() => {
    loadStructures();
  }, [loadStructures]);

  const filtered = fees;

  const totalCollected = summary?.totalCollected ?? 0;
  const totalOutstanding = summary?.totalOutstanding ?? 0;
  const collectionRate = summary?.collectionRate ?? 0;
  const revenueData = summary?.revenueData ?? [];
  const scholarshipCount = summary?.scholarshipCount ?? 0;

  const handleExport = () => {
    downloadCsv(
      `fee-records-${monthFilter !== "ALL" ? monthFilter : "all"}.csv`,
      ["Invoice #", "Student", "Student ID", "Program", "Month", "Gross Amount", "Discount", "Net Amount", "Status", "Method", "Paid On"],
      filtered.map((f) => [
        f.invoiceNo,
        f.student,
        f.studentId,
        f.program,
        f.month,
        f.grossAmount ?? f.amount,
        f.discount ?? 0,
        f.amount,
        f.status,
        f.method,
        f.paidAt,
      ])
    );
  };

  const openReceipt = (fee: FeeRow) => {
    const receiptData: FeeReceiptData = {
      invoiceNo: fee.invoiceNo,
      month: fee.month,
      monthKey: fee.monthKey,
      amount: fee.amount,
      grossAmount: fee.grossAmount ?? fee.amount,
      discount: fee.discount ?? 0,
      currency: fee.currency || instituteInfo.currency || "PKR",
      dueDate: fee.dueDate,
      paidAt: fee.paidAt,
      status: fee.status,
      method: fee.method,
      paymentMethod: fee.paymentMethod,
      notes: fee.notes,
      sponsorName: fee.sponsorName,
      student: {
        name: fee.student,
        studentId: fee.studentId,
        program: fee.program,
        gender: fee.gender,
      },
      parent: {
        name: fee.parentName,
        phone: fee.parentPhone,
        email: fee.parentEmail,
      },
      institute: {
        name: instituteInfo.name,
        phone: instituteInfo.phone,
        email: instituteInfo.email,
        address: instituteInfo.address,
        city: instituteInfo.city,
      },
    };
    setActiveReceipt(receiptData);
  };

  const openCollect = (fee: FeeRow) => {
    setCollectModal(fee);
    setCollectError(null);
    setCollectPayer("DIRECT");
    setCollectSponsorId("");
    setCollectMethod("CASH");
    setCollectPaidAt(new Date().toISOString().slice(0, 10));
    setCollectNotes("");
  };

  const selectSponsorPayer = () => {
    setCollectPayer("SPONSOR");
    setCollectMethod("SCHOLARSHIP");
    if (!collectSponsorId) {
      const preferred = collectModal?.availableSponsors?.[0]?.id || sponsors[0]?.id || "";
      setCollectSponsorId(preferred);
    }
  };

  const selectDirectPayer = () => {
    setCollectPayer("DIRECT");
    setCollectSponsorId("");
    setCollectMethod("CASH");
  };

  const handleCollect = async () => {
    if (!collectModal) return;
    const usingSponsor = collectPayer === "SPONSOR";
    if (usingSponsor && !collectSponsorId) {
      setCollectError("Select the sponsor who is paying this invoice.");
      return;
    }
    setCollectSaving(true);
    setCollectError(null);
    try {
      const res = await fetch(`/api/institute/fees/${collectModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "collect",
          paymentMethod: usingSponsor ? "SCHOLARSHIP" : collectMethod,
          sponsorId: usingSponsor ? collectSponsorId : null,
          paidAt: collectPaidAt || new Date().toISOString().slice(0, 10),
          notes: collectNotes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to collect payment");
      
      const collectedFee = {
        ...collectModal,
        status: "PAID",
        paidAt: collectPaidAt,
        paymentMethod: usingSponsor ? "SCHOLARSHIP" : collectMethod,
        method: usingSponsor ? "Scholarship" : collectMethod.replace(/_/g, " "),
        notes: collectNotes,
      };
      
      setCollectModal(null);
      await loadFees();

      // Automatically pop up receipt modal for immediate preview/download!
      openReceipt(collectedFee);
    } catch (err) {
      setCollectError(err instanceof Error ? err.message : "Failed to collect");
    } finally {
      setCollectSaving(false);
    }
  };

  const openEdit = (fee: FeeRow) => {
    setEditModal(fee);
    setEditError(null);
    const gross = fee.grossAmount ?? fee.amount;
    const discount = fee.discount ?? 0;
    setEditForm({
      amount: String(gross),
      discount: String(discount),
      netAmount: String(fee.amount),
      dueDate: fee.dueDate || "",
      month: fee.monthKey || "",
      status: fee.status,
      paymentMethod: fee.paymentMethod || "",
      paidAt: fee.paidAt || "",
      notes: fee.notes || "",
    });
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/institute/fees/${editModal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          amount: Number(editForm.amount),
          discount: Number(editForm.discount || 0),
          netAmount: Number(editForm.netAmount),
          dueDate: editForm.dueDate || undefined,
          month: editForm.month || null,
          status: editForm.status,
          paymentMethod: editForm.paymentMethod || null,
          paidAt: editForm.status === "PAID" ? editForm.paidAt || new Date().toISOString().slice(0, 10) : null,
          notes: editForm.notes || null,
          clearPaidAt: editForm.status !== "PAID" && editForm.status !== "WAIVED",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update fee");
      setEditModal(null);
      await loadFees();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(`/api/institute/fees/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        await loadFees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteSaving(false);
    }
  };

  const handleClearBatch = async () => {
    setClearBatchSaving(true);
    try {
      const res = await fetch(`/api/institute/fees?month=${clearBatchMonth}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowClearBatchModal(false);
        await loadFees();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClearBatchSaving(false);
    }
  };

  const handleGenerateMonthly = async () => {
    setBillingSaving(true);
    setBillingSuccessMessage(null);
    try {
      const res = await fetch("/api/institute/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: billingMonth,
          dueDay: Number(billingDueDay),
          amount: Number(billingFallback),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBillingSuccessMessage(
          `Generated ${data.created} invoice(s) for ${formatMonthOption(billingMonth)}. (${data.alreadyBilled} student(s) were already billed).`
        );
        // Set filter to newly generated month so user sees them right away
        setMonthFilter(billingMonth);
        await loadFees();
      } else {
        alert(data.error || "Failed to generate invoices");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating monthly invoices");
    } finally {
      setBillingSaving(false);
    }
  };

  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setStructureSaving(true);
    try {
      const res = await fetch("/api/institute/fee-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: structureForm.name,
          programType: structureForm.programType,
          amount: Number(structureForm.amount),
        }),
      });
      if (res.ok) {
        setStructureForm({ name: "", programType: "HIFZ", amount: "5000" });
        await loadStructures();
      }
    } finally {
      setStructureSaving(false);
    }
  };

  const handleToggleStructure = async (id: string, isActive: boolean) => {
    await fetch(`/api/institute/fee-structures/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadStructures();
  };

  const linkedSponsorIds = new Set(
    (collectModal?.availableSponsors || []).map((s) => s.id)
  );
  const selectedSponsor = sponsors.find((s) => s.id === collectSponsorId);
  const sponsorShortOnFunds =
    Boolean(collectModal) &&
    Boolean(selectedSponsor) &&
    selectedSponsor!.balance < collectModal!.amount;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-heading">Fee & Revenue Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Track student monthly tuition, issue paid receipts, and manage collections.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap items-center">
          <button
            type="button"
            className="btn-primary text-sm py-2"
            onClick={() => {
              setShowBillingPanel((v) => !v);
              setBillingSuccessMessage(null);
            }}
          >
            <Plus className="h-4 w-4" />
            Generate Invoices
          </button>
          
          <button
            type="button"
            className="btn-ghost text-sm py-2"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>

          {canEditFees && (
            <button
              type="button"
              className="btn-ghost text-xs py-2 text-red-600 hover:bg-red-50 border-red-200"
              onClick={() => {
                setClearBatchMonth(monthFilter);
                setShowClearBatchModal(true);
              }}
              title="Delete fee records"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset Fee Data
            </button>
          )}
        </div>
      </div>

      {/* Generation Panel */}
      {showBillingPanel && (
        <div className="dash-card p-6 border-2 border-primary-200 bg-gradient-to-br from-green-50/50 to-emerald-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Generate Monthly Tuition Invoices</h3>
              <p className="text-xs text-gray-500">
                Generates invoices for all active students. Program fee structures and active scholarships/concessions are applied automatically.
              </p>
            </div>
            <button
              type="button"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              onClick={() => setShowBillingPanel(false)}
            >
              ✕
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Month</label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Due Day</label>
              <input
                type="number"
                min={1}
                max={28}
                value={billingDueDay}
                onChange={(e) => setBillingDueDay(e.target.value)}
                className="form-input text-sm"
                placeholder="10"
              />
              <p className="text-[10px] text-gray-400 mt-1">e.g. 10th of the month</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Fallback Amount (PKR)</label>
              <input
                type="number"
                value={billingFallback}
                onChange={(e) => setBillingFallback(e.target.value)}
                className="form-input text-sm"
              />
              <p className="text-[10px] text-gray-400 mt-1">If no program structure matches</p>
            </div>
          </div>

          {billingSuccessMessage && (
            <div className="p-3 bg-green-100 text-green-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>{billingSuccessMessage}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              className="btn-ghost text-xs py-2"
              onClick={() => setShowBillingPanel(false)}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-primary text-sm py-2 px-5 shadow-sm"
              onClick={handleGenerateMonthly}
              disabled={billingSaving}
            >
              {billingSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Generating Invoices...
                </>
              ) : (
                `Generate for ${formatMonthOption(billingMonth)}`
              )}
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: DollarSign, color: "bg-green-50 text-green-700" },
          { label: "Outstanding Dues", value: formatCurrency(totalOutstanding), icon: AlertCircle, color: "bg-red-50 text-red-700" },
          { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "Scholarships", value: `${scholarshipCount} active`, icon: CreditCard, color: "bg-purple-50 text-purple-700" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="kpi-card p-4 flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0", c.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      {revenueData.length > 0 && (
        <div className="dash-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Monthly Revenue & Dues Trend</h3>
              <p className="text-xs text-gray-400">Collections vs outstanding balance across months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Line type="monotone" dataKey="collected" stroke="#1B5E20" strokeWidth={2.5} dot={{ fill: "#1B5E20", r: 4 }} name="Collected" />
              <Line type="monotone" dataKey="outstanding" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 2" dot={{ fill: "#EF4444", r: 4 }} name="Outstanding" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Fee Structures Collapsible Setup */}
      <div className="dash-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Program Fee Structures</h3>
            <p className="text-xs text-gray-500">Base monthly fee amounts by program type (used when generating invoices)</p>
          </div>
        </div>
        
        {structures.length > 0 && (
          <div className="grid sm:grid-cols-3 gap-3">
            {structures.map((s) => (
              <div key={s.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 text-xs block">{s.name}</span>
                  <span className="text-primary-800 font-bold text-sm">{formatCurrency(s.amount)}</span>
                  <span className="text-[10px] text-gray-400 block">{s.programType || "All Programs"} · Monthly</span>
                </div>
                <button
                  type="button"
                  className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-lg transition", s.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600")}
                  onClick={() => handleToggleStructure(s.id, s.isActive)}
                >
                  {s.isActive ? "Active" : "Inactive"}
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddStructure} className="grid sm:grid-cols-4 gap-2.5 items-end pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fee Name</label>
            <input
              className="form-input text-xs"
              value={structureForm.name}
              onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
              placeholder="e.g. Hifz Monthly"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Program</label>
            <select
              className="form-input text-xs"
              value={structureForm.programType}
              onChange={(e) => setStructureForm({ ...structureForm, programType: e.target.value })}
            >
              <option value="HIFZ">HIFZ</option>
              <option value="NAZRA">NAZRA</option>
              <option value="TAJWEED">TAJWEED</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Amount (PKR)</label>
            <input
              type="number"
              className="form-input text-xs"
              value={structureForm.amount}
              onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary text-xs py-2" disabled={structureSaving}>
            {structureSaving ? "Saving..." : "Add Fee Structure"}
          </button>
        </form>
      </div>

      {/* Main Filter & Ledger Table */}
      <div className="dash-card overflow-hidden">
        
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-gray-50/40">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, student ID, invoice #..."
              className="form-input pl-9 text-xs"
              id="input-search-fees"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center flex-wrap">
            {/* Month Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="form-input text-xs w-auto py-1.5"
                id="select-fee-month"
              >
                <option value="ALL">All Months</option>
                {distinctMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthOption(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input text-xs w-auto py-1.5"
                id="select-fee-status"
              >
                <option value="ALL">All Status</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
                <option value="WAIVED">100% Scholarship</option>
                <option value="PARTIAL">Partial</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadFees}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 transition"
              title="Refresh ledger"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice # & Student</th>
                <th>Program</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Paid Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-700" />
                    Loading fee records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-gray-400 space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-gray-300" />
                    <p className="font-medium text-gray-600 text-sm">No fee invoices found for the selected filter.</p>
                    <p className="text-xs text-gray-400">Click &quot;Generate Invoices&quot; above to create monthly tuition vouchers for your students.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const cfg = statusConfig[f.status] || statusConfig.PENDING;
                  const Icon = cfg.icon;
                  const isPaid = f.status === "PAID";
                  const isWaived = f.status === "WAIVED";

                  return (
                    <tr key={f.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Student & Invoice No */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm">
                            {getInitials(f.student)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 text-sm whitespace-nowrap">{f.student}</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-mono text-emerald-800 font-semibold">{f.invoiceNo}</span>
                              <span>·</span>
                              <span className="font-mono text-gray-400 text-[11px]">{f.studentId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Program */}
                      <td>
                        <span className="pill text-[11px] py-0.5 bg-gray-100 text-gray-700">
                          {f.program}
                        </span>
                      </td>

                      {/* Billing Month */}
                      <td>
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{f.month}</span>
                      </td>

                      {/* Amount with breakdown */}
                      <td>
                        <div>
                          <span className="font-bold text-gray-900 text-sm">
                            {f.amount === 0 ? (
                              <span className="text-green-600 font-semibold">Scholarship</span>
                            ) : (
                              formatCurrency(f.amount)
                            )}
                          </span>
                          {f.discount && f.discount > 0 ? (
                            <span className="block text-[10px] text-green-600">
                              (-{formatCurrency(f.discount)} off)
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={cn("pill text-xs flex items-center gap-1 w-fit", cfg.pill)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td>
                        <div className="text-xs text-gray-600">
                          <span>{f.method || "—"}</span>
                          {f.sponsorName ? (
                            <span className="block text-[10px] text-purple-600 font-medium">via {f.sponsorName}</span>
                          ) : null}
                        </div>
                      </td>

                      {/* Paid Date */}
                      <td>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {f.paidAt ? new Date(f.paidAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1.5 justify-end">
                          
                          {/* Invoice / Receipt Button (Shows when Paid or Waived) */}
                          {(isPaid || isWaived) ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 text-green-800 hover:bg-green-100 border border-green-200 text-xs font-semibold shadow-2xs transition"
                              onClick={() => openReceipt(f)}
                              title="View & Download Official Paid Receipt"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Receipt
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-800 text-white hover:bg-primary-900 text-xs font-semibold shadow-2xs transition"
                              id={`btn-collect-${f.id}`}
                              onClick={() => openCollect(f)}
                              title="Record payment for this student"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Collect
                            </button>
                          )}

                          {canEditFees && (
                            <>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                title="Edit fee voucher"
                                onClick={() => openEdit(f)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Delete fee record"
                                onClick={() => setDeleteTarget(f)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paid Receipt Modal */}
      {activeReceipt && (
        <FeeReceiptModal
          receiptData={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Collect Fee Modal */}
      {collectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => !collectSaving && setCollectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-gray-100">
            <h3 className="font-display font-bold text-lg text-gray-900">Record Fee Payment</h3>
            
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900 text-sm">{collectModal.student}</span>
                <span className="font-mono text-emerald-800 font-semibold">{collectModal.invoiceNo}</span>
              </div>
              <p className="text-gray-500">{collectModal.studentId} · {collectModal.month} ({collectModal.program})</p>
              <div className="pt-2 flex justify-between items-baseline border-t border-gray-200/60 mt-2">
                <span className="text-gray-500 font-medium">Net Amount Due:</span>
                <span className="text-base font-bold text-primary-800">{formatCurrency(collectModal.amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Who is paying?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={selectDirectPayer}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium text-left transition",
                    collectPayer === "DIRECT"
                      ? "border-primary-600 bg-primary-50 text-primary-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  Parent / Student
                  <span className="block text-[10px] font-normal text-gray-500">Direct payment</span>
                </button>
                <button
                  type="button"
                  onClick={selectSponsorPayer}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium text-left transition",
                    collectPayer === "SPONSOR"
                      ? "border-purple-600 bg-purple-50 text-purple-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  Sponsor Fund
                  <span className="block text-[10px] font-normal text-gray-500">Paid by donation</span>
                </button>
              </div>
            </div>

            {collectPayer === "SPONSOR" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Sponsor</label>
                {sponsors.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    No active sponsors found. Add a sponsor first.
                  </p>
                ) : (
                  <select
                    className="form-input text-xs"
                    value={collectSponsorId}
                    onChange={(e) => setCollectSponsorId(e.target.value)}
                  >
                    <option value="">— Choose a sponsor —</option>
                    {sponsors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {linkedSponsorIds.has(s.id) ? " (linked)" : ""}
                        {` · balance ${formatCurrency(s.balance)}`}
                      </option>
                    ))}
                  </select>
                )}
                {sponsorShortOnFunds && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    {selectedSponsor?.name} has {formatCurrency(selectedSponsor?.balance ?? 0)} available, less than invoice amount.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                  <select
                    className="form-input text-xs"
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="IBFT">IBFT</option>
                    <option value="RAAST">Raast</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="EASYPAISA">EasyPaisa</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    className="form-input text-xs"
                    value={collectPaidAt}
                    onChange={(e) => setCollectPaidAt(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Remarks / Transaction Reference</label>
              <input
                className="form-input text-xs"
                value={collectNotes}
                onChange={(e) => setCollectNotes(e.target.value)}
                placeholder="e.g. Receipt #1234 or Bank Ref ID"
              />
            </div>

            {collectError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{collectError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost flex-1 text-xs py-2"
                disabled={collectSaving}
                onClick={() => setCollectModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center text-xs py-2 font-semibold"
                disabled={collectSaving || (collectPayer === "SPONSOR" && !collectSponsorId)}
                onClick={handleCollect}
              >
                {collectSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm & View Receipt"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fee Record Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => !editSaving && setEditModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-gray-900">Edit Fee Record</h3>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-xs">
              <p className="font-semibold text-gray-900">{editModal.student}</p>
              <p className="text-gray-500 font-mono">{editModal.invoiceNo} · {editModal.studentId}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gross Amount</label>
                <input
                  type="number"
                  min="0"
                  className="form-input text-xs"
                  value={editForm.amount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    const discount = Number(editForm.discount || 0);
                    setEditForm((f) => ({
                      ...f,
                      amount,
                      netAmount: String(Math.max(0, Number(amount || 0) - discount)),
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discount / Concession</label>
                <input
                  type="number"
                  min="0"
                  className="form-input text-xs"
                  value={editForm.discount}
                  onChange={(e) => {
                    const discount = e.target.value;
                    setEditForm((f) => ({
                      ...f,
                      discount,
                      netAmount: String(Math.max(0, Number(f.amount || 0) - Number(discount || 0))),
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Net Payable Amount</label>
                <input
                  type="number"
                  min="0"
                  className="form-input text-xs font-bold text-primary-800"
                  value={editForm.netAmount}
                  onChange={(e) => setEditForm((f) => ({ ...f, netAmount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Month</label>
                <input
                  type="month"
                  className="form-input text-xs"
                  value={editForm.month}
                  onChange={(e) => setEditForm((f) => ({ ...f, month: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="form-input text-xs"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  className="form-input text-xs"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                  <option value="WAIVED">100% Scholarship (Waived)</option>
                </select>
              </div>
              {editForm.status === "PAID" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Paid On</label>
                    <input
                      type="date"
                      className="form-input text-xs"
                      value={editForm.paidAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, paidAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
                    <select
                      className="form-input text-xs"
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="IBFT">IBFT</option>
                      <option value="RAAST">Raast</option>
                      <option value="JAZZCASH">JazzCash</option>
                      <option value="EASYPAISA">EasyPaisa</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="SCHOLARSHIP">Scholarship / Sponsor</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Remarks</label>
                <textarea
                  className="form-input text-xs min-h-[60px]"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            {editError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{editError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost flex-1 text-xs py-2"
                disabled={editSaving}
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center text-xs py-2"
                disabled={editSaving}
                onClick={handleEditSave}
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Record Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Delete Fee Voucher?</h3>
            </div>
            <p className="text-xs text-gray-500">
              Are you sure you want to delete invoice <span className="font-mono font-bold text-gray-800">{deleteTarget.invoiceNo}</span> for <span className="font-semibold text-gray-800">{deleteTarget.student}</span> ({deleteTarget.month})? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost flex-1 text-xs py-2"
                disabled={deleteSaving}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger flex-1 text-xs py-2 font-semibold"
                disabled={deleteSaving}
                onClick={handleDeleteRecord}
              >
                {deleteSaving ? "Deleting..." : "Delete Voucher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Fee Batch Modal */}
      {showClearBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 rounded-xl bg-red-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Reset / Clear Fee Records</h3>
            </div>
            <p className="text-xs text-gray-500">
              Choose which fee records to clear. This will delete the generated vouchers from the database so you can regenerate clean data.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Scope to Delete</label>
              <select
                value={clearBatchMonth}
                onChange={(e) => setClearBatchMonth(e.target.value)}
                className="form-input text-xs"
              >
                <option value="ALL">All Months (Clear Entire Fee Ledger)</option>
                {distinctMonths.map((m) => (
                  <option key={m} value={m}>
                    Only {formatMonthOption(m)} ({m})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost flex-1 text-xs py-2"
                disabled={clearBatchSaving}
                onClick={() => setShowClearBatchModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger flex-1 text-xs py-2 font-semibold"
                disabled={clearBatchSaving}
                onClick={handleClearBatch}
              >
                {clearBatchSaving ? "Clearing..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
