"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { todayDateKey } from "@/lib/timezone";

type Child = { id: string; fullName: string; studentId: string };
type LeaveRow = {
  id: string;
  studentName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  reviewNote?: string | null;
};

const statusStyle: Record<string, string> = {
  PENDING: "pill-warning",
  APPROVED: "pill-success",
  REJECTED: "pill-danger",
  CANCELLED: "bg-gray-100 text-gray-600",
};

export function ParentLeavePanel() {
  const today = todayDateKey();
  const [children, setChildren] = useState<Child[]>([]);
  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    startDate: today,
    endDate: today,
    reason: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parent/leave-requests");
      if (!res.ok) return;
      const data = await res.json();
      setChildren(data.children || []);
      setRequests(data.requests || []);
      setForm((f) => ({
        ...f,
        studentId: f.studentId || data.children?.[0]?.id || "",
      }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId || !form.reason.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/parent/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success("Leave request submitted");
      setForm((f) => ({ ...f, reason: "", startDate: today, endDate: today }));
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="dash-card p-5">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <CalendarPlus className="h-4 w-4 text-primary-700" /> Request leave
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Submit absence in advance. Staff will approve and mark attendance automatically.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Child</label>
            <select
              className="form-input text-xs"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              required
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.studentId})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">From</label>
              <input
                type="date"
                className="form-input text-xs"
                min={today}
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
              <input
                type="date"
                className="form-input text-xs"
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reason</label>
            <textarea
              className="form-input text-xs h-20 resize-none"
              placeholder="e.g. Family travel / medical appointment"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary text-xs py-2 w-full justify-center" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit leave request"}
          </button>
        </form>
      </div>

      <div className="dash-card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Your requests</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No leave requests yet.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.studentName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.startDate} → {r.endDate}
                    </p>
                  </div>
                  <span className={cn("pill text-[10px]", statusStyle[r.status] || "bg-gray-100")}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">{r.reason}</p>
                {r.reviewNote && (
                  <p className="text-[11px] text-primary-700 mt-1">Note: {r.reviewNote}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
