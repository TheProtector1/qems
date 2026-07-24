"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Edit2, Trash2, X, Loader2, Heart, TrendingUp,
  Users, HandCoins, Calendar, Search, Gift, Receipt, Briefcase, Eye, ImageIcon,
  Wallet, ArrowDownCircle, ArrowUpCircle, PiggyBank, UserPlus,
} from "lucide-react";
import { cn, formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  SPONSOR_TYPES,
  DONATION_FREQUENCIES,
  DONATION_CATEGORIES,
  DONATION_STATUSES,
  PAYMENT_METHODS,
  getSponsorTypeLabel,
  getFrequencyLabel,
  getCategoryMeta,
  getStatusMeta,
  getPaymentMethodLabel,
  periodMonthFromDate,
} from "@/lib/sponsors-donations";
import { compressImageFile } from "@/lib/image";

type Sponsor = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  profession: string | null;
  employer: string | null;
  city: string | null;
  cnic: string | null;
  photo: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  totalDonated: number;
  totalSpent?: number;
  balance?: number;
  sponsoredStudentCount?: number;
  sponsoredStudents?: Array<{
    linkId: string;
    id: string;
    fullName: string;
    studentId: string;
    programType: string;
    notes: string | null;
  }>;
  _count?: { donations: number };
};

type Donation = {
  id: string;
  amount: number;
  currency: string;
  donationDate: string;
  frequency: string;
  category: string;
  status: string;
  paymentMethod: string | null;
  referenceNo: string | null;
  purpose: string | null;
  notes: string | null;
  periodMonth: string | null;
  sponsorId: string | null;
  sponsor: { id: string; name: string; type: string } | null;
  receivedByName: string | null;
  hasReceipt?: boolean;
  receiptData?: string | null;
};

type FundSummary = {
  collected: number;
  spent: number;
  balance: number;
  generalCollected: number;
  totalInflow: number;
  donationCount: number;
  feePaymentCount: number;
  sponsoredStudentCount: number;
};

type Summary = {
  monthTotal: number;
  yearTotal: number;
  pledgedTotal: number;
  activeSponsors: number;
  donationCount: number;
  monthlyTrend: Array<{ month: string; total: number }>;
  funds?: FundSummary;
};

const emptyDonationForm = () => ({
  amount: "",
  donationDate: new Date().toISOString().split("T")[0],
  frequency: "MONTHLY",
  category: "GENERAL",
  status: "RECEIVED",
  paymentMethod: "CASH",
  referenceNo: "",
  purpose: "",
  notes: "",
  sponsorId: "",
  periodMonth: periodMonthFromDate(new Date()),
  receivedByName: "",
  receiptData: null as string | null,
});

const emptySponsorForm = () => ({
  name: "",
  type: "INDIVIDUAL",
  email: "",
  phone: "",
  organization: "",
  profession: "",
  employer: "",
  city: "",
  cnic: "",
  photo: null as string | null,
  address: "",
  notes: "",
});

function SponsorAvatar({ name, photo, size = "md" }: { name: string; photo?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-10 w-10 text-sm", md: "h-14 w-14 text-lg", lg: "h-20 w-20 text-2xl" };
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo} alt={name} className={cn("rounded-2xl object-cover ring-2 ring-white shadow-sm", sizes[size])} />
    );
  }
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center ring-2 ring-white shadow-sm", sizes[size])}>
      {getInitials(name)}
    </div>
  );
}

export function SponsorsDonationsContent() {
  const [tab, setTab] = useState<"overview" | "donations" | "sponsors">("overview");
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const [donationModal, setDonationModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [donationForm, setDonationForm] = useState(emptyDonationForm());

  const [sponsorModal, setSponsorModal] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [sponsorForm, setSponsorForm] = useState(emptySponsorForm());
  const [profileSponsor, setProfileSponsor] = useState<Sponsor | null>(null);
  const [profileDonations, setProfileDonations] = useState<Donation[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [funds, setFunds] = useState<FundSummary | null>(null);
  const [allStudents, setAllStudents] = useState<Array<{ id: string; fullName: string; studentId: string }>>([]);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: filterMonth,
        year: filterYear,
        summary: "true",
      });
      if (filterCategory !== "ALL") params.set("category", filterCategory);
      if (filterStatus !== "ALL") params.set("status", filterStatus);

      const [sponsorsRes, donationsRes] = await Promise.all([
        fetch("/api/institute/sponsors"),
        fetch(`/api/institute/donations?${params}`),
      ]);

      if (sponsorsRes.ok) {
        const data = await sponsorsRes.json();
        setSponsors(data.sponsors || []);
        if (data.funds) setFunds(data.funds);
      }
      if (donationsRes.ok) {
        const data = await donationsRes.json();
        setDonations(data.donations || []);
        setSummary(data.summary || null);
        if (data.summary?.funds) setFunds(data.summary.funds);
      }
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterCategory, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredDonations = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return donations;
    return donations.filter(
      (d) =>
        d.sponsor?.name.toLowerCase().includes(q) ||
        d.purpose?.toLowerCase().includes(q) ||
        d.referenceNo?.toLowerCase().includes(q) ||
        d.notes?.toLowerCase().includes(q)
    );
  }, [donations, search]);

  const openNewDonation = () => {
    setEditingDonation(null);
    setDonationForm(emptyDonationForm());
    setDonationModal(true);
  };

  const openEditDonation = async (d: Donation) => {
    setEditingDonation(d);
    let receiptData: string | null = null;
    if (d.hasReceipt) {
      const res = await fetch(`/api/institute/donations/${d.id}`);
      if (res.ok) {
        const data = await res.json();
        receiptData = data.donation?.receiptData || null;
      }
    }
    setDonationForm({
      amount: String(d.amount),
      donationDate: d.donationDate.slice(0, 10),
      frequency: d.frequency,
      category: d.category,
      status: d.status,
      paymentMethod: d.paymentMethod || "CASH",
      referenceNo: d.referenceNo || "",
      purpose: d.purpose || "",
      notes: d.notes || "",
      sponsorId: d.sponsorId || "",
      periodMonth: d.periodMonth || periodMonthFromDate(d.donationDate),
      receivedByName: d.receivedByName || "",
      receiptData,
    });
    setDonationModal(true);
  };

  const saveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
        sponsorId: donationForm.sponsorId || null,
        periodMonth: donationForm.periodMonth || periodMonthFromDate(donationForm.donationDate),
        receiptData: donationForm.receiptData || null,
        receivedByName: donationForm.receivedByName || null,
      };
      const res = editingDonation
        ? await fetch(`/api/institute/donations/${editingDonation.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/institute/donations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        setDonationModal(false);
        loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteDonation = async (id: string) => {
    if (!confirm("Delete this donation record?")) return;
    await fetch(`/api/institute/donations/${id}`, { method: "DELETE" });
    loadData();
  };

  const openNewSponsor = () => {
    setEditingSponsor(null);
    setSponsorForm(emptySponsorForm());
    setSponsorModal(true);
  };

  const openEditSponsor = (s: Sponsor) => {
    setEditingSponsor(s);
    setSponsorForm({
      name: s.name,
      type: s.type,
      email: s.email || "",
      phone: s.phone || "",
      organization: s.organization || "",
      profession: s.profession || "",
      employer: s.employer || "",
      city: s.city || "",
      cnic: s.cnic || "",
      photo: s.photo,
      address: s.address || "",
      notes: s.notes || "",
    });
    setSponsorModal(true);
  };

  const openSponsorProfile = async (s: Sponsor) => {
    setProfileSponsor(s);
    setProfileLoading(true);
    setAssignStudentId("");
    try {
      const [res, studentsRes] = await Promise.all([
        fetch(`/api/institute/sponsors/${s.id}`),
        allStudents.length ? Promise.resolve(null) : fetch("/api/institute/students?pageSize=200"),
      ]);
      if (res.ok) {
        const data = await res.json();
        setProfileSponsor(data.sponsor);
        setProfileDonations(data.sponsor.donations || []);
      }
      if (studentsRes && studentsRes.ok) {
        const data = await studentsRes.json();
        setAllStudents(
          (data.students || []).map((st: { id: string; fullName: string; studentId: string }) => ({
            id: st.id,
            fullName: st.fullName,
            studentId: st.studentId,
          }))
        );
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const assignStudent = async () => {
    if (!profileSponsor || !assignStudentId) return;
    setAssignSaving(true);
    try {
      const res = await fetch(`/api/institute/sponsors/${profileSponsor.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: assignStudentId }),
      });
      if (res.ok) {
        setAssignStudentId("");
        await openSponsorProfile(profileSponsor);
        loadData();
      }
    } finally {
      setAssignSaving(false);
    }
  };

  const unlinkStudent = async (studentId: string) => {
    if (!profileSponsor || !confirm("Remove this student from the sponsor?")) return;
    await fetch(
      `/api/institute/sponsors/${profileSponsor.id}/students?studentId=${studentId}`,
      { method: "DELETE" }
    );
    await openSponsorProfile(profileSponsor);
    loadData();
  };

  const handleSponsorPhoto = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setSponsorForm((f) => ({ ...f, photo: compressed }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Photo upload failed");
    }
  };

  const handleReceiptUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setDonationForm((f) => ({ ...f, receiptData: compressed }));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Receipt upload failed");
    }
  };

  const saveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editingSponsor
        ? await fetch(`/api/institute/sponsors/${editingSponsor.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sponsorForm),
          })
        : await fetch("/api/institute/sponsors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sponsorForm),
          });
      if (res.ok) {
        setSponsorModal(false);
        loadData();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteSponsor = async (id: string) => {
    if (!confirm("Delete this sponsor? Donation records will be kept but unlinked.")) return;
    await fetch(`/api/institute/sponsors/${id}`, { method: "DELETE" });
    loadData();
  };

  const maxTrend = Math.max(...(summary?.monthlyTrend.map((t) => t.total) || [1]), 1);

  if (loading && !donations.length && !sponsors.length) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading sponsors & donations…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-purple-100 mb-2">
              <Gift className="h-3.5 w-3.5" /> Waqf & Community Support
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Sponsors & Donations</h2>
            <p className="text-purple-100/90 text-sm mt-2 max-w-xl">
              Track donor funds: money collected, spent on student fees, and balance still in stock. Link sponsors to students to pay invoices from their fund.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={openNewSponsor} className="btn-ghost bg-white/10 text-white border border-white/20 hover:bg-white/20 text-sm">
              <Users className="h-4 w-4" /> Add Sponsor
            </button>
            <button type="button" onClick={openNewDonation} className="btn-primary bg-white text-purple-900 hover:bg-purple-50 text-sm">
              <Plus className="h-4 w-4" /> Log Donation
            </button>
          </div>
        </div>
        {(funds || summary) && (
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              {
                label: "Collected (sponsor funds)",
                value: formatCurrency(funds?.collected ?? summary?.yearTotal ?? 0),
                icon: ArrowDownCircle,
              },
              {
                label: "Spent on fees",
                value: formatCurrency(funds?.spent ?? 0),
                icon: ArrowUpCircle,
              },
              {
                label: "In stock (balance)",
                value: formatCurrency(funds?.balance ?? 0),
                icon: PiggyBank,
              },
              {
                label: "Sponsored students",
                value: funds?.sponsoredStudentCount ?? summary?.activeSponsors ?? 0,
                icon: Users,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 border border-white/10 p-4">
                <s.icon className="h-4 w-4 text-purple-200 mb-2" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-[11px] text-purple-100/80">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: "overview", label: "Overview" },
          { key: "donations", label: "Donations" },
          { key: "sponsors", label: "Sponsors" },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key ? "bg-white text-purple-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {funds && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="dash-card p-5 border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold uppercase tracking-wide">
                  <Wallet className="h-4 w-4" /> Collected
                </div>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{formatCurrency(funds.collected)}</p>
                <p className="text-xs text-gray-500 mt-1">{funds.donationCount} received donation{funds.donationCount !== 1 ? "s" : ""} into sponsor funds</p>
                {funds.generalCollected > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">+ {formatCurrency(funds.generalCollected)} unassigned / general</p>
                )}
              </div>
              <div className="dash-card p-5 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold uppercase tracking-wide">
                  <HandCoins className="h-4 w-4" /> Spent on fees
                </div>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{formatCurrency(funds.spent)}</p>
                <p className="text-xs text-gray-500 mt-1">{funds.feePaymentCount} invoice{funds.feePaymentCount !== 1 ? "s" : ""} paid from sponsor funds</p>
              </div>
              <div className="dash-card p-5 border-l-4 border-l-purple-500">
                <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold uppercase tracking-wide">
                  <PiggyBank className="h-4 w-4" /> In stock
                </div>
                <p className="font-display text-2xl font-bold text-gray-900 mt-2">{formatCurrency(funds.balance)}</p>
                <p className="text-xs text-gray-500 mt-1">Available for future sponsored fee payments</p>
              </div>
            </div>
          )}
          {summary && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="dash-card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Trend (Last 6 Months)</h3>
            <div className="space-y-3">
              {summary.monthlyTrend.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No donation data yet.</p>
              ) : (
                summary.monthlyTrend.map((t) => (
                  <div key={t.month} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-500 w-16">{t.month}</span>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(8, (t.total / maxTrend) * 100)}%` }}
                      >
                        <span className="text-[10px] font-bold text-white">{formatCurrency(t.total)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="dash-card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Donations</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {donations.slice(0, 8).map((d) => {
                const cat = getCategoryMeta(d.category);
                return (
                  <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{d.sponsor?.name || "Anonymous"}</p>
                      <p className="text-xs text-gray-500">{formatDate(d.donationDate)} · {getFrequencyLabel(d.frequency)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{formatCurrency(d.amount)}</p>
                      <span className={cn("pill text-[9px] py-0", cat.color)}>{cat.label}</span>
                    </div>
                  </div>
                );
              })}
              {donations.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Log your first donation to see activity here.</p>
              )}
            </div>
          </div>
        </div>
          )}
          {!summary && !funds && (
            <p className="text-sm text-gray-400 text-center py-12">No fund data yet. Log a donation to get started.</p>
          )}
        </div>
      )}

      {/* Donations tab */}
      {tab === "donations" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Month</label>
              <input type="month" className="form-input text-sm" value={`${filterYear}-${filterMonth.padStart(2, "0")}`}
                onChange={(e) => { const [y, m] = e.target.value.split("-"); setFilterYear(y); setFilterMonth(String(parseInt(m, 10))); }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
              <select className="form-input text-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="ALL">All categories</option>
                {DONATION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
              <select className="form-input text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="ALL">All statuses</option>
                {DONATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-gray-500 block mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input className="form-input pl-9 text-sm" placeholder="Sponsor, purpose, ref…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <button type="button" onClick={openNewDonation} className="btn-primary text-sm ml-auto">
              <Plus className="h-4 w-4" /> Log Donation
            </button>
          </div>

          <div className="dash-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sponsor</th>
                  <th>Amount</th>
                  <th>Frequency</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Received by</th>
                  <th>Receipt</th>
                  <th>Purpose</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">No donations for this period.</td></tr>
                ) : filteredDonations.map((d) => {
                  const cat = getCategoryMeta(d.category);
                  const st = getStatusMeta(d.status);
                  return (
                    <tr key={d.id}>
                      <td className="text-sm">{formatDate(d.donationDate)}</td>
                      <td>
                        <p className="font-medium text-gray-900">{d.sponsor?.name || "—"}</p>
                        {d.periodMonth && <p className="text-[10px] text-gray-400">Period: {d.periodMonth}</p>}
                      </td>
                      <td className="font-bold text-green-700">{formatCurrency(d.amount)}</td>
                      <td><span className="text-xs text-gray-600">{getFrequencyLabel(d.frequency)}</span></td>
                      <td><span className={cn("pill text-[10px] py-0", cat.color)}>{cat.label}</span></td>
                      <td><span className={cn("pill text-[10px] py-0", st.pill)}>{st.label}</span></td>
                      <td className="text-xs text-gray-600">{getPaymentMethodLabel(d.paymentMethod)}</td>
                      <td className="text-xs text-gray-600">{d.receivedByName || "—"}</td>
                      <td>
                        {d.hasReceipt ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await fetch(`/api/institute/donations/${d.id}`);
                              if (res.ok) {
                                const data = await res.json();
                                setReceiptPreview(data.donation?.receiptData || null);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 hover:underline"
                          >
                            <Receipt className="h-3.5 w-3.5" /> View
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-600 max-w-[120px] truncate">{d.purpose || "—"}</td>
                      <td className="text-right">
                        <button type="button" onClick={() => openEditDonation(d)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                        <button type="button" onClick={() => deleteDonation(d.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sponsors tab */}
      {tab === "sponsors" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={openNewSponsor} className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Add Sponsor
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsors.length === 0 ? (
              <div className="col-span-full dash-card p-12 text-center border-dashed">
                <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">No sponsors yet</p>
                <p className="text-sm text-gray-500 mt-1">Add individuals, organizations, or anonymous donors.</p>
              </div>
            ) : sponsors.map((s) => {
              return (
                <div key={s.id} className={cn("dash-card p-5 border-l-4", s.isActive ? "border-l-purple-500" : "border-l-gray-300 opacity-60")}>
                  <div className="flex justify-between items-start mb-3">
                    <SponsorAvatar name={s.name} photo={s.photo} size="md" />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openSponsorProfile(s)} className="p-1.5 text-gray-400 hover:text-purple-600" title="View profile"><Eye className="h-4 w-4" /></button>
                      <button type="button" onClick={() => openEditSponsor(s)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => deleteSponsor(s.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <button type="button" onClick={() => openSponsorProfile(s)} className="text-left w-full">
                    <h3 className="font-display font-bold text-gray-900 hover:text-purple-800">{s.name}</h3>
                  </button>
                  <p className="text-xs text-gray-500 mt-0.5">{getSponsorTypeLabel(s.type)}{s.organization && ` · ${s.organization}`}</p>
                  {s.profession && <p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><Briefcase className="h-3 w-3" /> {s.profession}</p>}
                  {(s.email || s.phone) && (
                    <p className="text-xs text-gray-500 mt-2">{s.email}{s.phone && ` · ${s.phone}`}</p>
                  )}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Collected</span>
                      <span className="font-semibold text-green-700">{formatCurrency(s.totalDonated)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Spent on fees</span>
                      <span className="font-semibold text-amber-700">{formatCurrency(s.totalSpent ?? 0)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">In stock</span>
                      <span className="font-bold text-purple-800">{formatCurrency(s.balance ?? s.totalDonated)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-gray-400">
                        {s.sponsoredStudentCount ?? 0} sponsored student{(s.sponsoredStudentCount ?? 0) !== 1 ? "s" : ""}
                      </span>
                      <span className={cn("pill text-[10px] py-0", s.isActive ? "pill-success" : "bg-gray-100 text-gray-500")}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Donation modal */}
      {donationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display text-lg font-bold">{editingDonation ? "Edit Donation" : "Log Donation"}</h3>
              <button type="button" onClick={() => setDonationModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveDonation} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Amount (PKR)</label>
                  <input type="number" required min="1" step="0.01" className="form-input" value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Date Received</label>
                  <input type="date" required className="form-input" value={donationForm.donationDate}
                    onChange={(e) => setDonationForm({
                      ...donationForm,
                      donationDate: e.target.value,
                      periodMonth: periodMonthFromDate(e.target.value),
                    })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Frequency</label>
                  <select className="form-input" value={donationForm.frequency}
                    onChange={(e) => setDonationForm({ ...donationForm, frequency: e.target.value })}>
                    {DONATION_FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Reporting Period</label>
                  <input type="month" className="form-input" value={donationForm.periodMonth?.slice(0, 7) || ""}
                    onChange={(e) => setDonationForm({ ...donationForm, periodMonth: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={donationForm.category}
                    onChange={(e) => setDonationForm({ ...donationForm, category: e.target.value })}>
                    {DONATION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={donationForm.status}
                    onChange={(e) => setDonationForm({ ...donationForm, status: e.target.value })}>
                    {DONATION_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Sponsor</label>
                <select className="form-input" value={donationForm.sponsorId}
                  onChange={(e) => setDonationForm({ ...donationForm, sponsorId: e.target.value })}>
                  <option value="">Anonymous / No sponsor linked</option>
                  {sponsors.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Payment mode *</label>
                  <select required className="form-input" value={donationForm.paymentMethod}
                    onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}>
                    {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Transaction / reference #</label>
                  <input className="form-input" value={donationForm.referenceNo}
                    onChange={(e) => setDonationForm({ ...donationForm, referenceNo: e.target.value })} placeholder="IBFT ref, cheque no., etc." />
                </div>
              </div>
              <div>
                <label className="form-label">Received by (staff name)</label>
                <input className="form-input" value={donationForm.receivedByName}
                  onChange={(e) => setDonationForm({ ...donationForm, receivedByName: e.target.value })}
                  placeholder="Who received this donation at the institute?" />
              </div>
              <div>
                <label className="form-label">Receipt upload <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <label className="btn-ghost text-sm py-2 cursor-pointer">
                    <ImageIcon className="h-4 w-4" /> Upload receipt
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReceiptUpload(e.target.files?.[0] || null)} />
                  </label>
                  {donationForm.receiptData && (
                    <>
                      <button type="button" onClick={() => setReceiptPreview(donationForm.receiptData)} className="text-xs text-purple-700 font-medium hover:underline">Preview</button>
                      <button type="button" onClick={() => setDonationForm({ ...donationForm, receiptData: null })} className="text-xs text-red-600 hover:underline">Remove</button>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Photo of bank receipt, cash voucher, or transfer screenshot</p>
              </div>
              <div>
                <label className="form-label">Purpose</label>
                <input className="form-input" value={donationForm.purpose}
                  onChange={(e) => setDonationForm({ ...donationForm, purpose: e.target.value })} placeholder="e.g. Monthly scholarship fund" />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea rows={2} className="form-input" value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setDonationModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingDonation ? "Save" : "Log Donation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sponsor modal */}
      {sponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display text-lg font-bold">{editingSponsor ? "Edit donor profile" : "Add donor / sponsor"}</h3>
              <button type="button" onClick={() => setSponsorModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveSponsor} className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <SponsorAvatar name={sponsorForm.name || "Donor"} photo={sponsorForm.photo} size="lg" />
                <div>
                  <label className="btn-ghost text-sm py-2 cursor-pointer inline-flex">
                    <ImageIcon className="h-4 w-4" /> Upload photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSponsorPhoto(e.target.files?.[0] || null)} />
                  </label>
                  {sponsorForm.photo && (
                    <button type="button" className="block text-xs text-red-600 mt-1" onClick={() => setSponsorForm({ ...sponsorForm, photo: null })}>Remove photo</button>
                  )}
                </div>
              </div>
              <div>
                <label className="form-label">Full name *</label>
                <input required className="form-input" value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="form-input" value={sponsorForm.type}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, type: e.target.value })}>
                  {SPONSOR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Organization (if applicable)</label>
                <input className="form-input" value={sponsorForm.organization}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, organization: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Profession</label>
                  <input className="form-input" value={sponsorForm.profession}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, profession: e.target.value })} placeholder="e.g. Doctor, Business owner" />
                </div>
                <div>
                  <label className="form-label">Employer / business</label>
                  <input className="form-input" value={sponsorForm.employer}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, employer: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input className="form-input" value={sponsorForm.city}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, city: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">CNIC (optional)</label>
                  <input className="form-input" value={sponsorForm.cnic}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, cnic: e.target.value })} placeholder="xxxxx-xxxxxxx-x" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={sponsorForm.email}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={sponsorForm.phone}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="form-label">Address</label>
                <input className="form-input" value={sponsorForm.address}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, address: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea rows={2} className="form-input" value={sponsorForm.notes}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setSponsorModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSponsor ? "Save" : "Add Sponsor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donor profile modal */}
      {profileSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-start gap-4">
              <div className="flex items-start gap-4">
                <SponsorAvatar name={profileSponsor.name} photo={profileSponsor.photo} size="lg" />
                <div>
                  <h3 className="font-display text-xl font-bold text-gray-900">{profileSponsor.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{getSponsorTypeLabel(profileSponsor.type)}</p>
                  {profileSponsor.profession && (
                    <p className="text-sm text-gray-700 mt-2 flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-gray-400" /> {profileSponsor.profession}
                      {profileSponsor.employer && ` at ${profileSponsor.employer}`}
                    </p>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => setProfileSponsor(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Email", value: profileSponsor.email },
                  { label: "Phone", value: profileSponsor.phone },
                  { label: "City", value: profileSponsor.city },
                  { label: "CNIC", value: profileSponsor.cnic },
                  { label: "Organization", value: profileSponsor.organization },
                  { label: "Address", value: profileSponsor.address },
                ].map((row) => (
                  <div key={row.label} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{row.label}</p>
                    <p className="font-medium text-gray-900 mt-0.5">{row.value || "—"}</p>
                  </div>
                ))}
              </div>
              {profileSponsor.notes && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100">{profileSponsor.notes}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                  <p className="text-[10px] uppercase text-emerald-700 font-semibold">Collected</p>
                  <p className="font-bold text-emerald-800 mt-1">{formatCurrency(profileSponsor.totalDonated)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                  <p className="text-[10px] uppercase text-amber-700 font-semibold">Spent</p>
                  <p className="font-bold text-amber-800 mt-1">{formatCurrency(profileSponsor.totalSpent ?? 0)}</p>
                </div>
                <div className="rounded-xl bg-purple-50 border border-purple-100 p-3 text-center">
                  <p className="text-[10px] uppercase text-purple-700 font-semibold">In stock</p>
                  <p className="font-bold text-purple-800 mt-1">{formatCurrency(profileSponsor.balance ?? profileSponsor.totalDonated)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-purple-600" /> Sponsored students
                  </h4>
                </div>
                <div className="flex gap-2 mb-3">
                  <select
                    className="form-input text-sm flex-1"
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                  >
                    <option value="">Link a student…</option>
                    {allStudents
                      .filter(
                        (st) =>
                          !(profileSponsor.sponsoredStudents || []).some((ss) => ss.id === st.id)
                      )
                      .map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.fullName} ({st.studentId})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn-primary text-sm py-2 px-3"
                    disabled={!assignStudentId || assignSaving}
                    onClick={assignStudent}
                  >
                    {assignSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link"}
                  </button>
                </div>
                {(profileSponsor.sponsoredStudents || []).length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">
                    No students linked. Link students so their fees can be paid from this sponsor&apos;s fund.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(profileSponsor.sponsoredStudents || []).map((st) => (
                      <li
                        key={st.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{st.fullName}</p>
                          <p className="text-xs text-gray-400">
                            {st.studentId} · {st.programType}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => unlinkStudent(st.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Donation history</h4>
                  <p className="text-sm font-bold text-green-700">{formatCurrency(profileSponsor.totalDonated)} total</p>
                </div>
                {profileLoading ? (
                  <div className="py-8 text-center text-gray-400"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
                ) : profileDonations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No donations logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {profileDonations.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{formatCurrency(d.amount)}</p>
                          <p className="text-xs text-gray-500">{formatDate(d.donationDate)} · {getPaymentMethodLabel(d.paymentMethod)}</p>
                        </div>
                        <span className={cn("pill text-[10px] py-0", getCategoryMeta(d.category).color)}>{getCategoryMeta(d.category).label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { openEditSponsor(profileSponsor); setProfileSponsor(null); }} className="btn-ghost text-sm">Edit profile</button>
                <button type="button" onClick={() => setProfileSponsor(null)} className="btn-primary text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt preview */}
      {receiptPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setReceiptPreview(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Receipt className="h-4 w-4" /> Donation receipt</h3>
              <button type="button" onClick={() => setReceiptPreview(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={receiptPreview} alt="Donation receipt" className="w-full rounded-xl border border-gray-200" />
          </div>
        </div>
      )}
    </div>
  );
}
