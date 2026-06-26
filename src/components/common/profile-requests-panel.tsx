"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type RequestRow = {
  id: string;
  requestedChanges: Record<string, string>;
  previousValues: Record<string, string | null>;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    institute?: { name: string } | null;
  };
};

export function ProfileRequestsPanel({ apiBase }: { apiBase: "/api/institute/profile-requests" | "/api/admin/profile-requests" }) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [apiBase]);

  const review = async (id: string, action: "approve" | "reject") => {
    setActingId(id);
    try {
      const res = await fetch(apiBase, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading requests…
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        <UserCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        No pending profile change requests.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-sm text-gray-900">{req.user.name}</p>
              <p className="text-[10px] text-gray-400">
                {req.user.role.replace(/_/g, " ")} · {req.user.email}
                {req.user.institute?.name ? ` · ${req.user.institute.name}` : ""}
              </p>
              <div className="mt-2 space-y-1">
                {Object.entries(req.requestedChanges).map(([field, value]) => (
                  <p key={field} className="text-xs text-gray-600">
                    <span className="capitalize font-medium">{field}</span>:{" "}
                    <span className="text-gray-400 line-through mr-1">{req.previousValues[field] || "—"}</span>
                    → <span className="text-green-700 font-medium">{value}</span>
                  </p>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(req.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                type="button"
                disabled={actingId === req.id}
                onClick={() => review(req.id, "approve")}
                className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                title="Approve"
              >
                {actingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                disabled={actingId === req.id}
                onClick={() => review(req.id, "reject")}
                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                title="Reject"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
