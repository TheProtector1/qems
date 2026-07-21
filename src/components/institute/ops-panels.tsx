"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  QrCode,
  ScanLine,
  XCircle,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type LeaveRow = {
  id: string;
  studentName: string;
  studentCode: string;
  parentName: string;
  teacherName?: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

export function LeaveRequestsPanel({ compact = false }: { compact?: boolean }) {
  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/leave-requests?status=PENDING");
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id: string, action: "APPROVE" | "REJECT") => {
    setBusyId(id);
    try {
      const res = await fetch("/api/institute/leave-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(action === "APPROVE" ? "Leave approved" : "Leave declined");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn(!compact && "dash-card p-5")}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-primary-700" />
          Pending leave requests
        </h3>
        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg">
          {requests.length}
        </span>
      </div>
      {requests.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No pending leave requests.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-100 p-3 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {r.studentName}{" "}
                    <span className="text-xs font-mono text-gray-400">({r.studentCode})</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.startDate} → {r.endDate} · by {r.parentName}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{r.reason}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => review(r.id, "REJECT")}
                    className="btn-ghost text-xs py-1.5 px-2 text-red-600"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Decline
                  </button>
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() => review(r.id, "APPROVE")}
                    className="btn-primary text-xs py-1.5 px-2"
                  >
                    {busyId === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QrCheckInPanel() {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const checkIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/institute/attendance/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim(), action: "checkin" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Check-in failed");
      const msg = data.alreadyMarked
        ? `${data.student.fullName} already marked ${data.status}`
        : `${data.student.fullName} checked in ✓`;
      setLast(msg);
      toast.success(msg);
      setToken("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dash-card p-5">
      <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary-700" /> QR check-in
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Scan or paste a student QR token to mark PRESENT instantly.
      </p>
      <form onSubmit={checkIn} className="flex gap-2">
        <input
          className="form-input text-xs flex-1 font-mono"
          placeholder="Paste QR token…"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn-primary text-xs py-2 px-3" disabled={busy || !token.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
          Check in
        </button>
      </form>
      {last && <p className="text-xs text-primary-700 mt-2 font-medium">{last}</p>}
    </div>
  );
}
