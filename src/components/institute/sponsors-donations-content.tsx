"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Edit2, Trash2, X, Loader2, Heart, TrendingUp,
  Users, HandCoins, Calendar, Search, Gift,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
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
  periodMonthFromDate,
} from "@/lib/sponsors-donations";

type Sponsor = {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  organization: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  totalDonated: number;
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
};

type Summary = {
  monthTotal: number;
  yearTotal: number;
  pledgedTotal: number;
  activeSponsors: number;
  donationCount: number;
  monthlyTrend: Array<{ month: string; total: number }>;
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
});

const emptySponsorForm = () => ({
  name: "",
  type: "INDIVIDUAL",
  email: "",
  phone: "",
  organization: "",
  address: "",
  notes: "",
});

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
  const [saving, setSaving] = useState(false);

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
      }
      if (donationsRes.ok) {
        const data = await donationsRes.json();
        setDonations(data.donations || []);
        setSummary(data.summary || null);
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

  const openEditDonation = (d: Donation) => {
    setEditingDonation(d);
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
      address: s.address || "",
      notes: s.notes || "",
    });
    setSponsorModal(true);
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
              Track donors, log contributions on any schedule — daily, monthly, or one-time — and monitor pledged vs received funds.
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
        {summary && (
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "This Month", value: formatCurrency(summary.monthTotal), icon: Calendar },
              { label: "Year to Date", value: formatCurrency(summary.yearTotal), icon: TrendingUp },
              { label: "Active Sponsors", value: summary.activeSponsors, icon: Users },
              { label: "Pledged (Open)", value: formatCurrency(summary.pledgedTotal), icon: HandCoins },
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
      {tab === "overview" && summary && (
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
                  <th>Purpose</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonations.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No donations for this period.</td></tr>
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
                      <td className="text-sm text-gray-600 max-w-[140px] truncate">{d.purpose || "—"}</td>
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
              const typeMeta = SPONSOR_TYPES.find((t) => t.value === s.type);
              return (
                <div key={s.id} className={cn("dash-card p-5 border-l-4", s.isActive ? "border-l-purple-500" : "border-l-gray-300 opacity-60")}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-11 w-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                      {typeMeta?.icon || "👤"}
                    </div>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEditSponsor(s)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="h-4 w-4" /></button>
                      <button type="button" onClick={() => deleteSponsor(s.id)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{getSponsorTypeLabel(s.type)}{s.organization && ` · ${s.organization}`}</p>
                  {(s.email || s.phone) && (
                    <p className="text-xs text-gray-500 mt-2">{s.email}{s.phone && ` · ${s.phone}`}</p>
                  )}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(s.totalDonated)}</p>
                      <p className="text-[10px] text-gray-400">Total contributed</p>
                    </div>
                    <span className={cn("pill text-[10px] py-0", s.isActive ? "pill-success" : "bg-gray-100 text-gray-500")}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
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
                  <label className="form-label">Payment Method</label>
                  <select className="form-input" value={donationForm.paymentMethod}
                    onChange={(e) => setDonationForm({ ...donationForm, paymentMethod: e.target.value })}>
                    {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Reference / Receipt #</label>
                  <input className="form-input" value={donationForm.referenceNo}
                    onChange={(e) => setDonationForm({ ...donationForm, referenceNo: e.target.value })} placeholder="Optional" />
                </div>
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-display text-lg font-bold">{editingSponsor ? "Edit Sponsor" : "Add Sponsor"}</h3>
              <button type="button" onClick={() => setSponsorModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveSponsor} className="p-6 space-y-4">
              <div>
                <label className="form-label">Name</label>
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
    </div>
  );
}
