"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2, Search, Check, X, ShieldAlert, Plus,
  Eye, MoreHorizontal, Users, RefreshCw, Loader2,
  Mail, Phone, MapPin, Calendar, ExternalLink, Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type InstituteStatus = "APPROVED" | "PENDING" | "REJECTED" | "SUSPENDED";

interface InstituteRow {
  id: string;
  name: string;
  email: string;
  city: string;
  phone: string;
  owner: string;
  studentsCount: number;
  teachersCount: number;
  plan: string;
  status: InstituteStatus;
  registered: string;
  slug: string;
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

// ─── Institute Detail Modal ──────────────────────────────────
function InstituteModal({ inst, onClose }: { inst: InstituteRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">{inst.name}</h2>
                <p className="text-primary-200 text-sm mt-0.5">{inst.slug}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <span className={cn("pill text-[10px] py-0.5", statusStyles[inst.status])}>{inst.status}</span>
            <span className={cn("pill text-[10px] py-0.5", planBadge[inst.plan] || "pill-info")}>{inst.plan}</span>
          </div>
        </div>
        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{inst.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{inst.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{inst.city || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>Registered {inst.registered}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-display font-bold text-gray-900">{inst.studentsCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Students</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-display font-bold text-gray-900">{inst.teachersCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Teachers</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-1">Institution Head</p>
            <p className="text-sm font-semibold text-gray-900">{inst.owner || "—"}</p>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button onClick={onClose} className="btn-ghost text-sm py-2 flex-1">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── 3-Dot Dropdown ──────────────────────────────────────────
function InstituteActionsMenu({ inst, onApprove, onReject, onClose: closeMenu, onDelete }: {
  inst: InstituteRow;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeMenu]);

  return (
    <div ref={ref} className="absolute right-0 top-8 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-48 text-sm">
      {inst.status === "PENDING" && (
        <>
          <button onClick={() => { onApprove(); closeMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 text-xs font-medium">
            <Check className="h-3.5 w-3.5" /> Approve Institute
          </button>
          <button onClick={() => { onReject(); closeMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-medium">
            <X className="h-3.5 w-3.5" /> Reject Application
          </button>
        </>
      )}
      {inst.status === "APPROVED" && (
        <button onClick={() => { onReject(); closeMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 text-xs font-medium">
          <ShieldAlert className="h-3.5 w-3.5" /> Suspend Institute
        </button>
      )}
      {inst.status === "SUSPENDED" && (
        <button onClick={() => { onApprove(); closeMenu(); }} className="w-full flex items-center gap-2 px-4 py-2 text-green-600 hover:bg-green-50 text-xs font-medium">
          <Check className="h-3.5 w-3.5" /> Reactivate
        </button>
      )}
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => { window.open(`mailto:${inst.email}`); closeMenu(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 text-xs font-medium"
      >
        <Mail className="h-3.5 w-3.5" /> Email Institute
      </button>
      <Link
        href={`/admin/institutes/${inst.id}`}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 text-xs font-medium"
        onClick={closeMenu}
      >
        <ExternalLink className="h-3.5 w-3.5" /> Open Full Profile
      </Link>
      <button
        onClick={() => { onDelete(); closeMenu(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-xs font-medium"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Institute
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function AdminInstitutesContent() {
  const [institutes, setInstitutes] = useState<InstituteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewingInst, setViewingInst] = useState<InstituteRow | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchInstitutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/institutes");
      if (!res.ok) throw new Error("Failed to fetch institutes");
      const data = await res.json();
      const rows: InstituteRow[] = (data.institutes || []).map((inst: any) => {
        const ownerUser = inst.users?.find((u: any) => u.role === "INSTITUTE_OWNER");
        return {
          id: inst.id,
          name: inst.name,
          email: inst.email,
          city: inst.city || "—",
          phone: inst.phone || "",
          slug: inst.slug,
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

  useEffect(() => { fetchInstitutes(); }, []);

  const updateStatus = async (id: string, isActive: boolean, isApproved: boolean) => {
    try {
      const res = await fetch("/api/admin/institutes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive, isApproved }),
      });
      if (res.ok) {
        fetchInstitutes();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleApprove = (id: string) => {
    updateStatus(id, true, true);
  };

  const handleReject = (id: string) => {
    const inst = institutes.find((i) => i.id === id);
    if (!inst) return;
    if (inst.status === "APPROVED") {
      // Suspend
      updateStatus(id, false, true);
    } else {
      // Reject
      updateStatus(id, false, false);
    }
  };

  const deleteInstitute = async (id: string) => {
    if (!confirm("Permanently delete this institute and all related data? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/institutes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstitutes((prev) => prev.filter((i) => i.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete institute");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete institute");
    }
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
    <>
      {/* Detail Modal */}
      {viewingInst && (
        <InstituteModal inst={viewingInst} onClose={() => setViewingInst(null)} />
      )}

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="page-header-row">
          <div>
            <h2 className="section-heading font-display font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary-700 shrink-0" /> Platform Tenants
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage all registered Quran institutes on the platform</p>
          </div>
          <div className="page-header-actions">
            <button className="btn-ghost text-sm py-2" onClick={fetchInstitutes} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            <Link href="/admin/institutes/new" className="btn-primary text-sm py-2" id="btn-create-institute">
              <Plus className="h-4 w-4" /> Create Institute
            </Link>
          </div>
        </div>

        {/* Stats */}
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
                  statusFilter === s ? "bg-primary-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              <span className="text-sm">Loading institutes…</span>
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
                  <th>Owner</th>
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
                      {institutes.length === 0 ? "No institutes in the database." : "No institutes match your filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((inst) => (
                  <tr key={inst.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-4 w-4 text-primary-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{inst.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{inst.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><p className="text-xs font-semibold text-gray-800">{inst.owner}</p></td>
                    <td><p className="text-xs text-gray-500">{inst.city}</p></td>
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
                      <span className={cn("pill text-[10px] py-0.5", statusStyles[inst.status])}>{inst.status}</span>
                    </td>
                    <td className="text-gray-400 text-xs">{inst.registered}</td>
                    <td className="text-right">
                      <div className="flex justify-end items-center gap-1.5">
                        {inst.status === "PENDING" && (
                          <>
                            <button onClick={() => handleApprove(inst.id)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 border border-green-200" title="Approve">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleReject(inst.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" title="Reject">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {inst.status === "APPROVED" && (
                          <button onClick={() => handleReject(inst.id)} className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200" title="Suspend">
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Eye button — opens detail modal */}
                        <button
                          onClick={() => setViewingInst(inst)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 border border-transparent transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {/* 3-dot menu */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === inst.id ? null : inst.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent transition-colors"
                            title="More options"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                          {openMenuId === inst.id && (
                            <InstituteActionsMenu
                              inst={inst}
                              onApprove={() => handleApprove(inst.id)}
                              onReject={() => handleReject(inst.id)}
                              onDelete={() => deleteInstitute(inst.id)}
                              onClose={() => setOpenMenuId(null)}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
