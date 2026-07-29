"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DollarSign, CheckCircle2, Clock, AlertCircle, TrendingUp,
  Download, Plus, Search, CreditCard, Loader2, Pencil,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn, formatCurrency, getInitials, downloadCsv } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type FeeRow = {
  id: string;
  studentDbId?: string;
  student: string;
  studentId: string;
  program: string;
  month: string;
  monthKey?: string | null;
  amount: number;
  grossAmount?: number;
  discount?: number;
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

const statusConfig: Record<string, { label: string; pill: string; icon: React.ElementType }> = {
  PAID: { label: "Paid", pill: "pill-success", icon: CheckCircle2 },
  PENDING: { label: "Pending", pill: "pill-warning", icon: Clock },
  OVERDUE: { label: "Overdue", pill: "pill-danger", icon: AlertCircle },
  PARTIAL: { label: "Partial", pill: "pill-warning", icon: Clock },
  WAIVED: { label: "Waived", pill: "pill-info", icon: CheckCircle2 },
};

export function FinanceContent() {
  const { data: session } = useSession();
  const canEditFees =
    session?.user?.role === "INSTITUTE_OWNER" || session?.user?.role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fees, setFees] = useState<FeeRow[]>([]);
  const [summary, setSummary] = useState<{
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
    scholarshipCount: number;
    revenueData: { month: string; collected: number; outstanding: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBillingPanel, setShowBillingPanel] = useState(false);
  const [structures, setStructures] = useState<Array<{
    id: string; name: string; programType: string | null; amount: number; frequency: string; isActive: boolean;
  }>>([]);
  const [billingMonth, setBillingMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [billingDueDay, setBillingDueDay] = useState("10");
  const [billingFallback, setBillingFallback] = useState("5000");
  const [billingSaving, setBillingSaving] = useState(false);
  const [structureForm, setStructureForm] = useState({ name: "", programType: "HIFZ", amount: "5000" });
  const [structureSaving, setStructureSaving] = useState(false);
  const [collectModal, setCollectModal] = useState<FeeRow | null>(null);
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectPayer, setCollectPayer] = useState<"DIRECT" | "SPONSOR">("DIRECT");
  const [collectSponsorId, setCollectSponsorId] = useState("");
  const [collectSaving, setCollectSaving] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<SponsorOption[]>([]);
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
      const res = await fetch("/api/institute/fees?summary=true&limit=200");
      if (!res.ok) throw new Error("Failed to load fees");
      const data = await res.json();
      setFees(data.fees || []);
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
  }, []);

  useEffect(() => {
    loadFees();
    loadStructures();
  }, [loadFees, loadStructures]);

  const filtered = fees.filter((f) => {
    const matchSearch =
      f.student.toLowerCase().includes(search.toLowerCase()) ||
      f.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalCollected = summary?.totalCollected ?? 0;
  const totalOutstanding = summary?.totalOutstanding ?? 0;
  const collectionRate = summary?.collectionRate ?? 0;
  const revenueData = summary?.revenueData ?? [];
  const scholarshipCount = summary?.scholarshipCount ?? 0;

  const handleExport = () => {
    downloadCsv(
      "fee-records.csv",
      ["Student", "Student ID", "Program", "Month", "Amount", "Status", "Method", "Paid On"],
      filtered.map((f) => [f.student, f.studentId, f.program, f.month, f.amount, f.status, f.method, f.paidAt])
    );
  };

  const openCollect = async (fee: FeeRow) => {
    setCollectModal(fee);
    setCollectError(null);
    setCollectPayer("DIRECT");
    setCollectSponsorId("");
    setCollectMethod("CASH");
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to collect payment");
      setCollectModal(null);
      await loadFees();
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

  const handleRecordPayment = () => {
    setShowPaymentForm((v) => !v);
    if (!showPaymentForm) {
      document.getElementById("input-search-fees")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleGenerateMonthly = async () => {
    setBillingSaving(true);
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
      if (res.ok) {
        await loadFees();
        setShowBillingPanel(false);
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading fee records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading">Fee Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{fees.length} fee record{fees.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button type="button" className="btn-ghost text-sm py-2" onClick={() => setShowBillingPanel((v) => !v)}>
            <Plus className="h-4 w-4" />
            Generate Invoices
          </button>
          <button className="btn-ghost text-sm py-2" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="btn-primary text-sm py-2" id="btn-record-payment" onClick={handleRecordPayment}>
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      {showBillingPanel && (
        <div className="dash-card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Generate Monthly Invoices</h3>
          <p className="text-sm text-gray-500">Uses active fee structures per program; scholarships are applied automatically.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Billing Month</label>
              <input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Day</label>
              <input type="number" min={1} max={28} value={billingDueDay} onChange={(e) => setBillingDueDay(e.target.value)} className="form-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Fallback Amount (PKR)</label>
              <input type="number" value={billingFallback} onChange={(e) => setBillingFallback(e.target.value)} className="form-input text-sm" />
            </div>
          </div>
          <button type="button" className="btn-primary text-sm py-2" onClick={handleGenerateMonthly} disabled={billingSaving}>
            {billingSaving ? "Generating..." : "Generate for All Active Students"}
          </button>
        </div>
      )}

      <div className="dash-card p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Fee Structures</h3>
        <p className="text-sm text-gray-500 mb-4">Default tuition amounts by program type</p>
        {structures.length > 0 && (
          <div className="overflow-x-auto mb-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Program</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td>{s.programType || "All"}</td>
                    <td>{formatCurrency(s.amount)}</td>
                    <td><span className={cn("pill text-[10px] py-0.5", s.isActive ? "pill-success" : "bg-gray-100 text-gray-500")}>{s.isActive ? "Active" : "Inactive"}</span></td>
                    <td>
                      <button type="button" className="text-xs text-primary-700 font-semibold" onClick={() => handleToggleStructure(s.id, s.isActive)}>
                        {s.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form onSubmit={handleAddStructure} className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
            <input className="form-input text-sm" value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })} placeholder="Hifz Monthly" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Program</label>
            <select className="form-input text-sm" value={structureForm.programType} onChange={(e) => setStructureForm({ ...structureForm, programType: e.target.value })}>
              <option value="HIFZ">HIFZ</option>
              <option value="NAZRA">NAZRA</option>
              <option value="TAJWEED">TAJWEED</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (PKR)</label>
            <input type="number" className="form-input text-sm" value={structureForm.amount} onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary text-sm py-2" disabled={structureSaving}>
            {structureSaving ? "Saving..." : "Add Structure"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: DollarSign, color: "bg-green-50 text-green-700" },
          { label: "Outstanding", value: formatCurrency(totalOutstanding), icon: AlertCircle, color: "bg-red-50 text-red-700" },
          { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "bg-blue-50 text-blue-700" },
          { label: "Scholarships", value: `${scholarshipCount} student${scholarshipCount !== 1 ? "s" : ""}`, icon: CreditCard, color: "bg-purple-50 text-purple-700" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="kpi-card p-4 flex items-center gap-3">
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

      {revenueData.length > 0 && (
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Revenue Trend</h3>
          <p className="text-xs text-gray-400 mb-6">Monthly fee collection vs outstanding</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
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

      <div className="dash-card overflow-hidden">
        <div className="p-5 border-b border-border flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="form-input pl-10"
              id="input-search-fees"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input w-auto"
            id="select-fee-status"
          >
            <option value="ALL">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Program</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Paid On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">No fee records found.</td>
                </tr>
              ) : filtered.map((f) => {
                const cfg = statusConfig[f.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{getInitials(f.student)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm whitespace-nowrap">{f.student}</p>
                          <p className="text-xs text-gray-400 font-mono">{f.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="text-sm text-gray-600">{f.program}</span></td>
                    <td><span className="text-sm text-gray-600 whitespace-nowrap">{f.month}</span></td>
                    <td>
                      <span className="font-semibold text-gray-900">
                        {f.amount === 0 ? <span className="text-green-600">Scholarship</span> : formatCurrency(f.amount)}
                      </span>
                    </td>
                    <td>
                      <span className={cn("pill", cfg.pill)}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-500">
                        {f.method || "—"}
                        {f.sponsorName ? (
                          <span className="block text-[10px] text-purple-600">via {f.sponsorName}</span>
                        ) : null}
                      </span>
                    </td>
                    <td><span className="text-sm text-gray-500">{f.paidAt || "—"}</span></td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        {canEditFees && (
                          <button
                            type="button"
                            className="btn-ghost text-xs py-1.5 px-2"
                            title="Edit fee record"
                            onClick={() => openEdit(f)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {f.status !== "PAID" && f.status !== "WAIVED" && (
                          <button
                            className="btn-ghost text-xs py-1.5 px-3"
                            id={`btn-collect-${f.id}`}
                            onClick={() => openCollect(f)}
                          >
                            Collect
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {collectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !collectSaving && setCollectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-display font-bold text-lg text-gray-900">Collect fee</h3>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm">
              <p className="font-semibold text-gray-900">{collectModal.student}</p>
              <p className="text-xs text-gray-500">{collectModal.studentId} · {collectModal.month}</p>
              <p className="mt-2 font-bold text-primary-800">{formatCurrency(collectModal.amount)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Who is paying?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={selectDirectPayer}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium text-left transition",
                    collectPayer === "DIRECT"
                      ? "border-primary-600 bg-primary-50 text-primary-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  Student / parent
                  <span className="block text-[10px] font-normal text-gray-500">Direct payment</span>
                </button>
                <button
                  type="button"
                  onClick={selectSponsorPayer}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium text-left transition",
                    collectPayer === "SPONSOR"
                      ? "border-purple-600 bg-purple-50 text-purple-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  Sponsor
                  <span className="block text-[10px] font-normal text-gray-500">Paid from sponsor fund</span>
                </button>
              </div>
            </div>

            {collectPayer === "SPONSOR" ? (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select sponsor</label>
                {sponsors.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                    No active sponsors yet. Add a sponsor before collecting from a sponsor fund.
                  </p>
                ) : (
                  <>
                    <select
                      className="form-input text-sm"
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
                    <p className="text-[10px] text-gray-400 mt-1">
                      This invoice is deducted from the selected sponsor&apos;s donation fund.
                    </p>
                    {sponsorShortOnFunds && (
                      <p className="text-[11px] text-amber-700 mt-1.5">
                        {selectedSponsor?.name} has {formatCurrency(selectedSponsor?.balance ?? 0)} available,
                        which is less than this invoice.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment method</label>
                <select
                  className="form-input text-sm"
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="IBFT">IBFT</option>
                  <option value="RAAST">Raast</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            )}

            {collectError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{collectError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn-ghost flex-1 text-sm py-2"
                disabled={collectSaving}
                onClick={() => setCollectModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center text-sm py-2"
                disabled={collectSaving || (collectPayer === "SPONSOR" && !collectSponsorId)}
                onClick={handleCollect}
              >
                {collectSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : collectPayer === "SPONSOR" ? (
                  "Confirm sponsor payment"
                ) : (
                  "Confirm payment"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !editSaving && setEditModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display font-bold text-lg text-gray-900">Edit fee record</h3>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm">
              <p className="font-semibold text-gray-900">{editModal.student}</p>
              <p className="text-xs text-gray-500">{editModal.studentId} · {editModal.month}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gross amount</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input text-sm"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Discount</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input text-sm"
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Net amount</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input text-sm"
                  value={editForm.netAmount}
                  onChange={(e) => setEditForm((f) => ({ ...f, netAmount: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Billing month</label>
                <input
                  type="month"
                  className="form-input text-sm"
                  value={editForm.month}
                  onChange={(e) => setEditForm((f) => ({ ...f, month: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Due date</label>
                <input
                  type="date"
                  className="form-input text-sm"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  className="form-input text-sm"
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                  <option value="WAIVED">Waived</option>
                </select>
              </div>
              {editForm.status === "PAID" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Paid on</label>
                    <input
                      type="date"
                      className="form-input text-sm"
                      value={editForm.paidAt}
                      onChange={(e) => setEditForm((f) => ({ ...f, paidAt: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Payment method</label>
                    <select
                      className="form-input text-sm"
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank transfer</option>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  className="form-input text-sm min-h-[72px]"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>
            </div>

            {editError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">{editError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn-ghost flex-1 text-sm py-2"
                disabled={editSaving}
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center text-sm py-2"
                disabled={editSaving}
                onClick={handleEditSave}
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
