"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Banknote, Loader2, RefreshCw, CheckCircle2, Clock, Users,
  Building2, ChevronLeft, ChevronRight, CreditCard, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Employee = {
  payeeType: "TEACHER" | "STAFF";
  payeeId: string;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  monthlySalary: number;
  bankName: string | null;
  accountTitle: string | null;
  accountNumber: string | null;
  iban: string | null;
  payment: {
    id: string;
    grossAmount: number;
    deductions: number;
    netAmount: number;
    status: string;
    paidAt: string | null;
    notes: string | null;
  } | null;
};

type HistoryRow = { month: string; gross: number; net: number; count: number };

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  });
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function SalariesPageContent() {
  const [periodMonth, setPeriodMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [summary, setSummary] = useState({ totalGross: 0, totalPaid: 0, totalPending: 0, employeeCount: 0 });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    grossAmount: "",
    deductions: "0",
    status: "PENDING",
    notes: "",
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    monthlySalary: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/institute/salaries?month=${periodMonth}`);
      if (!res.ok) return;
      const data = await res.json();
      setEmployees(data.employees || []);
      setHistory(data.history || []);
      setSummary(data.summary || { totalGross: 0, totalPaid: 0, totalPending: 0, employeeCount: 0 });
    } finally {
      setLoading(false);
    }
  }, [periodMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      grossAmount: String(emp.payment?.grossAmount ?? emp.monthlySalary ?? 0),
      deductions: String(emp.payment?.deductions ?? 0),
      status: emp.payment?.status ?? "PENDING",
      notes: emp.payment?.notes ?? "",
      bankName: emp.bankName ?? "",
      accountTitle: emp.accountTitle ?? "",
      accountNumber: emp.accountNumber ?? "",
      iban: emp.iban ?? "",
      monthlySalary: String(emp.monthlySalary ?? 0),
    });
  };

  const savePayment = async (markPaid = false) => {
    if (!editing) return;
    setSavingId(editing.payeeId);
    try {
      const res = await fetch("/api/institute/salaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payeeType: editing.payeeType,
          payeeId: editing.payeeId,
          periodMonth,
          grossAmount: form.grossAmount,
          deductions: form.deductions,
          status: markPaid ? "PAID" : form.status,
          notes: form.notes,
          bankName: form.bankName,
          accountTitle: form.accountTitle,
          accountNumber: form.accountNumber,
          iban: form.iban,
          monthlySalary: form.monthlySalary,
        }),
      });
      if (res.ok) {
        setEditing(null);
        await fetchData();
      }
    } finally {
      setSavingId(null);
    }
  };

  const netPreview = Math.max(0, Number(form.grossAmount || 0) - Number(form.deductions || 0));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="h-6 w-6 text-primary-700" /> Salaries & Payroll
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage monthly salaries, bank details, and payment records for teachers and staff
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPeriodMonth(shiftMonth(periodMonth, -1))} className="btn-ghost p-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[140px] text-center">
            {monthLabel(periodMonth)}
          </span>
          <button type="button" onClick={() => setPeriodMonth(shiftMonth(periodMonth, 1))} className="btn-ghost p-2">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={fetchData} className="btn-ghost text-sm py-2 ml-2" disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Employees", value: summary.employeeCount, icon: Users, color: "text-blue-700 bg-blue-50" },
          { label: "Gross (month)", value: `PKR ${summary.totalGross.toLocaleString()}`, icon: Banknote, color: "text-amber-700 bg-amber-50" },
          { label: "Paid", value: `PKR ${summary.totalPaid.toLocaleString()}`, icon: CheckCircle2, color: "text-green-700 bg-green-50" },
          { label: "Pending", value: `PKR ${summary.totalPending.toLocaleString()}`, icon: Clock, color: "text-orange-700 bg-orange-50" },
        ].map((k) => (
          <div key={k.label} className="kpi-card p-4">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-2", k.color)}>
              <k.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-gray-500">{k.label}</p>
            <p className="font-display text-lg font-bold text-gray-900">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dash-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading payroll…
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-16">No teachers or staff found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={`${emp.payeeType}-${emp.payeeId}`}>
                    <td>
                      <p className="font-semibold text-sm text-gray-900">{emp.name}</p>
                      <p className="text-[10px] text-gray-400">{emp.phone || emp.email}</p>
                    </td>
                    <td className="text-xs text-gray-600">{emp.role}</td>
                    <td className="text-xs font-semibold">
                      PKR {(emp.payment?.grossAmount ?? emp.monthlySalary).toLocaleString()}
                    </td>
                    <td className="text-xs font-semibold text-green-700">
                      PKR {(emp.payment?.netAmount ?? emp.monthlySalary).toLocaleString()}
                    </td>
                    <td>
                      <span className={cn(
                        "pill text-[10px] py-0.5",
                        emp.payment?.status === "PAID" ? "pill-success" : "pill-warning"
                      )}>
                        {emp.payment?.status || "Not set"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button type="button" onClick={() => openEdit(emp)} className="btn-ghost text-xs py-1.5">
                        <CreditCard className="h-3.5 w-3.5" /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="dash-card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-700" /> Payment History
          </h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-400">No salary records yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => (
                <button
                  key={h.month}
                  type="button"
                  onClick={() => setPeriodMonth(h.month)}
                  className={cn(
                    "w-full text-left rounded-xl border px-3 py-2.5 transition-colors",
                    h.month === periodMonth ? "border-primary-500 bg-primary-50" : "border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <p className="text-xs font-semibold text-gray-800">{monthLabel(h.month)}</p>
                  <p className="text-[10px] text-gray-500">
                    {h.count} payments · Net PKR {h.net.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-1">{editing.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{editing.role} · {monthLabel(periodMonth)}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Monthly salary (PKR)</label>
                <input className="form-input mt-1" value={form.monthlySalary}
                  onChange={(e) => setForm({ ...form, monthlySalary: e.target.value, grossAmount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Deductions (PKR)</label>
                <input className="form-input mt-1" value={form.deductions}
                  onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Gross this month</label>
                <input className="form-input mt-1" value={form.grossAmount}
                  onChange={(e) => setForm({ ...form, grossAmount: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Net (preview)</label>
                <input className="form-input mt-1 bg-gray-50" readOnly value={`PKR ${netPreview.toLocaleString()}`} />
              </div>
            </div>

            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Bank account</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Bank name</label>
                <input className="form-input mt-1" value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-600">Account title</label>
                <input className="form-input mt-1" value={form.accountTitle}
                  onChange={(e) => setForm({ ...form, accountTitle: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Account number</label>
                <input className="form-input mt-1" value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">IBAN</label>
                <input className="form-input mt-1" value={form.iban}
                  onChange={(e) => setForm({ ...form, iban: e.target.value })} />
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600">Notes</label>
              <textarea className="form-input mt-1 resize-none" rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={savingId === editing.payeeId} onClick={() => savePayment(false)}
                className="btn-ghost text-sm py-2">
                {savingId === editing.payeeId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save draft
              </button>
              <button type="button" disabled={savingId === editing.payeeId} onClick={() => savePayment(true)}
                className="btn-primary text-sm py-2">
                <CheckCircle2 className="h-4 w-4" /> Mark as paid
              </button>
              <button type="button" onClick={() => setEditing(null)} className="text-sm text-gray-500 px-3 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
