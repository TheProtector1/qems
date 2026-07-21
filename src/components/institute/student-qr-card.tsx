"use client";

import { useState } from "react";
import { Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function StudentQrCard({ studentId }: { studentId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (regenerate = false) => {
    setLoading(true);
    try {
      if (regenerate) {
        const res = await fetch("/api/institute/attendance/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "regenerate", studentId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setToken(data.qrToken);
        setName(data.student?.fullName || "");
        toast.success("QR code regenerated");
      } else {
        const res = await fetch(`/api/institute/attendance/qr?studentId=${studentId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        setToken(data.qrToken);
        setName(data.fullName || "");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <QrCode className="h-4 w-4 text-primary-700" /> Attendance QR
        </p>
        <div className="flex gap-1">
          <button type="button" className="btn-ghost text-xs py-1 px-2" onClick={() => load(false)} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Show"}
          </button>
          <button type="button" className="btn-ghost text-xs py-1 px-2" onClick={() => load(true)} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {token ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">{name} — show this code at check-in</p>
          {/* Lightweight QR via Google Chart API-free fallback: display token + printable block */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Student QR"
              className="mx-auto h-40 w-40"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(token)}`}
            />
            <p className="mt-2 text-[10px] font-mono text-gray-400 break-all px-2">{token}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400">Generate a QR code for gate / classroom check-in.</p>
      )}
    </div>
  );
}
