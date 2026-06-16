"use client";

import { useState, useEffect } from "react";
import {
  Building2, Search, Check, X, ShieldAlert, Plus,
  Eye, MoreHorizontal, Users, RefreshCw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type InstituteStatus = "APPROVED" | "PENDING" | "REJECTED" | "SUSPENDED";

interface InstituteRow {
  id: string;
  name: string;
  email: string;
  city: string;
  owner: string;
  studentsCount: number;
  teachersCount: number;
  plan: string;
  status: InstituteStatus;
  registered: string;
}

const statusStyles: Record<InstituteStatus, string> = {
  APPROVED: "pill-success",
  PENDING: "pill-warning",
  REJECTED: "pill-danger",
  SUSPENDED: "bg-gray-100 text-gray-600",
};

const planBadge: Record<string, string> = {
  STARTER: "pill-info",
  GROWTH: "pill-success",
  ENTERPRISE: "pill-gold",
};

function deriveStatus(inst: any): InstituteStatus {
  if (!inst.isActive) return "SUSPENDED";
  if (!inst.isApproved) return "PENDING";
  return "APPROVED";
}

export function AdminInstitutesContent() {
  const [institutes, setInstitutes] = useState<InstituteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchInstitutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/institutes");
      if (!res.ok) throw new Error("Failed to fetch institutes");
      const data = await res.json();
      const rows: InstituteRow[] = (data.institutes || []).map((inst: any) => {
        // Find the owner user
        const ownerUser = inst.users?.find((u: any) => u.role === "INSTITUTE_OWNER");
        return {
          id: inst.id,
          name: inst.name,
          email: inst.email,
          city: inst.city || "—",
          owner: ownerUser?.name || inst.directorName || "—",
          studentsCount: inst._count?.students ?? 0,
          teachersCount: inst._count?.teachers ?? 0,
          plan: inst.subscription?.plan || "STARTER",
          status: deriveStatus(inst),
          registered: inst.createdAt
            ? new Date(inst.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
            : "—",
        };
      });
      setInstitutes(rows);
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleApprove = async (id: string) => {
    // Optimistic UI update
    setInstitutes((prev) => prev.map((i) => i.id === id ? { ...i, status: "APPROVED" } : i));
  };

  const handleReject = async (id: string) => {
    setInstitutes((prev) => prev.map((i) => i.id === id ? { ...i, status: "REJECTED" } : i));
  };

  const filtered = institutes.filter((i) => {
    const matchSearch =
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.owner.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    ALL: institutes.length,
    APPROVED: institutes.filter((i) => i.status === "APPROVED").length,
    PENDING: institutes.filter((i) => i.status === "PENDING").length,
    REJECTED: institutes.filter((i) => i.status === "REJECTED").length,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-700" /> Platform Tenants
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage all registered Quran institutes on the platform
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn-ghost text-sm py-2" onClick={fetchInstitutes} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
          </button>
          <Link href="/admin/institutes/new" className="btn-primary text-sm py-2" id="btn-create-institute">
            <Plus className="h-4 w-4" /> Create Institute
          </Link>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", count: counts.ALL, color: "bg-blue-50 text-blue-700" },
          { label: "Approved", count: counts.APPROVED, color: "bg-green-50 text-green-700" },
          { label: "Pending", count: counts.PENDING, color: "bg-amber-50 text-amber-700" },
          { label: "Rejected", count: counts.REJECTED, color: "bg-red-50 text-red-700" },
        ].map((s) => (
          <div key={s.label} className="kpi-card p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{s.label}</span>
            <span className={cn("text-lg font-display font-bold px-3 py-0.5 rounded-lg", s.color)}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="dash-card p-4 bg-white flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search by name, owner, or email…"
            className="form-input pl-10 h-10 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="input-search-institutes"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                statusFilter === s
                  ? "bg-primary-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="dash-card overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            <span className="text-sm">Loading institutes from database…</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
            <p className="text-sm font-semibold">Failed to load institutes</p>
            <p className="text-xs text-gray-400">{error}</p>
            <button onClick={fetchInstitutes} className="btn-ghost text-xs mt-2">Try Again</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Institute</th>
                <th>Owner / Contact</th>
                <th>Location</th>
                <th>Plan</th>
                <th>Students</th>
                <th>Status</th>
                <th>Registered</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                    {institutes.length === 0
                      ? "No institutes found in the database."
                      : "No institutes match your search filters."}
                  </td>
                </tr>
              )}
              {filtered.map((inst) => (
                <tr key={inst.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-xs flex-shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{inst.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{inst.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-xs font-semibold text-gray-800">{inst.owner}</p>
                  </td>
                  <td>
                    <p className="text-xs text-gray-500">{inst.city}</p>
                  </td>
                  <td>
                    <span className={cn("pill text-[10px] py-0.5", planBadge[inst.plan] || "pill-info")}>
                      {inst.plan}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600 font-semibold">{inst.studentsCount}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn("pill text-[10px] py-0.5", statusStyles[inst.status])}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="text-gray-400 text-xs">{inst.registered}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {inst.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(inst.id)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 transition-colors"
                            title="Approve Institute"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleReject(inst.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                            title="Reject Institute"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {inst.status === "APPROVED" && (
                        <button
                          onClick={() => handleReject(inst.id)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors"
                          title="Suspend"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Link
                        href={`/admin/institutes/${inst.id}`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 border border-transparent transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent transition-colors" title="More">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
