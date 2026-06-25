"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldAlert, MessageSquare, Search, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  sender: string;
  priority: string;
  status: string;
  date: string;
};

export function AdminSupportContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading tickets...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary-700" /> Support Desk
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Solve technical tickets and tenant queries</p>
      </div>

      <div className="dash-card p-4 bg-white flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input placeholder="Search support tickets by ID or subject..." className="form-input pl-10 h-10 text-xs" />
        </div>
      </div>

      <div className="dash-card overflow-hidden bg-white">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Subject</th>
              <th>Tenant / sender</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Reported On</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">No support tickets yet.</td>
              </tr>
            ) : tickets.map((t) => (
              <tr key={t.id}>
                <td className="font-mono text-xs font-bold text-primary-700">{t.id}</td>
                <td className="font-semibold text-gray-900">{t.subject}</td>
                <td><span className="text-xs text-gray-600">{t.sender}</span></td>
                <td>
                  <span className={cn(
                    "pill text-[10px] py-0.5",
                    t.priority === "HIGH" && "pill-danger",
                    t.priority === "MEDIUM" && "pill-warning",
                    t.priority === "LOW" && "pill-info"
                  )}>
                    {t.priority}
                  </span>
                </td>
                <td>
                  <span className={cn(
                    "pill text-[10px] py-0.5",
                    t.status === "OPEN" || t.status === "IN_PROGRESS" ? "pill-warning" : "pill-success"
                  )}>
                    {t.status}
                  </span>
                </td>
                <td className="text-xs text-gray-500">{t.date}</td>
                <td className="text-right">
                  <button className="btn-ghost text-xs py-1 px-3">
                    <Eye className="h-3.5 w-3.5 inline mr-1" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-card p-5 bg-amber-50 border border-amber-100 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          High-priority tickets from paying tenants are escalated automatically. Response SLA: 4 business hours.
        </p>
      </div>
    </div>
  );
}
