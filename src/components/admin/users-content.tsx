"use client";

import { useState, useEffect, useRef } from "react";
import {
  Users, Search, Shield, Building2, GraduationCap, BookOpen,
  MoreHorizontal, UserCheck, UserX, Mail, Loader2, RefreshCw,
  Eye, EyeOff, Key, XCircle,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type Role = "SUPER_ADMIN" | "INSTITUTE_OWNER" | "BRANCH_MANAGER" | "TEACHER" | "PARENT" | "STUDENT";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  institute: string;
  isActive: boolean;
  createdAt: string;
}

const roleStyles: Record<Role, string> = {
  SUPER_ADMIN: "bg-violet-100 text-violet-800",
  INSTITUTE_OWNER: "bg-primary-100 text-primary-800",
  BRANCH_MANAGER: "bg-blue-100 text-blue-800",
  TEACHER: "bg-amber-100 text-amber-800",
  PARENT: "bg-teal-100 text-teal-700",
  STUDENT: "bg-pink-100 text-pink-800",
};

const roleIcon: Record<Role, React.ElementType> = {
  SUPER_ADMIN: Shield,
  INSTITUTE_OWNER: Building2,
  BRANCH_MANAGER: Building2,
  TEACHER: BookOpen,
  PARENT: Users,
  STUDENT: GraduationCap,
};

// ─── User Detail Modal ────────────────────────────────────────
function UserModal({ user, onClose }: { user: PlatformUser; onClose: () => void }) {
  const RoleIcon = roleIcon[user.role];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {getInitials(user.name)}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">{user.name}</h2>
                <p className="text-primary-200 text-xs mt-0.5">{user.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white")}>
              <RoleIcon className="h-3 w-3" />
              {user.role.replace(/_/g, " ")}
            </span>
            <span className={cn("pill text-[10px] py-0.5", user.isActive ? "pill-success" : "pill-danger")}>
              {user.isActive ? "Active" : "Disabled"}
            </span>
          </div>
        </div>
        {/* Details */}
        <div className="p-6 space-y-3">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span>{user.institute || "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Joined</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{user.createdAt}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Status</p>
              <p className={cn("text-sm font-semibold mt-0.5", user.isActive ? "text-green-600" : "text-red-500")}>
                {user.isActive ? "Active" : "Disabled"}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="btn-ghost text-sm py-2 w-full">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── User 3-Dot Dropdown ──────────────────────────────────────
function UserActionsMenu({ user, onToggle, onClose, onView }: {
  user: PlatformUser;
  onToggle: () => void;
  onView: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-8 z-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-48 text-sm">
      <button
        onClick={() => { onView(); onClose(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 text-xs font-medium"
      >
        <Eye className="h-3.5 w-3.5" /> View Profile
      </button>
      <button
        onClick={() => { window.open(`mailto:${user.email}`); onClose(); }}
        className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 text-xs font-medium"
      >
        <Mail className="h-3.5 w-3.5" /> Send Email
      </button>
      <div className="border-t border-gray-100 my-1" />
      <button
        onClick={() => { onToggle(); onClose(); }}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2 text-xs font-medium",
          user.isActive
            ? "text-red-500 hover:bg-red-50"
            : "text-green-600 hover:bg-green-50"
        )}
      >
        {user.isActive ? <><EyeOff className="h-3.5 w-3.5" /> Disable Account</> : <><UserCheck className="h-3.5 w-3.5" /> Enable Account</>}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function AdminUsersContent() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewingUser, setViewingUser] = useState<PlatformUser | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      const rows: PlatformUser[] = (data.users || []).map((u: any) => ({
        id: u.id,
        name: u.name || "Unknown",
        email: u.email,
        role: u.role as Role,
        institute: u.institute?.name || "—",
        isActive: u.isActive,
        createdAt: u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
      }));
      setUsers(rows);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !user.isActive }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update status");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };


  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.institute.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      {viewingUser && <UserModal user={viewingUser} onClose={() => setViewingUser(null)} />}

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-primary-700" /> Platform Users
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">All user accounts across every institute tenant</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost text-sm py-2" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </button>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
              {users.length} Total Users
            </span>
          </div>
        </div>

        {/* Role Summary */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {(["ALL", "INSTITUTE_OWNER", "TEACHER", "PARENT", "STUDENT", "BRANCH_MANAGER"] as const).map((r) => {
            const count = r === "ALL" ? users.length : users.filter((u) => u.role === r).length;
            const label = r === "ALL" ? "All" : r.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            return (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={cn(
                  "p-3 rounded-xl text-center border transition-all",
                  roleFilter === r ? "border-primary-400 bg-primary-50" : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <p className="font-display text-xl font-bold text-gray-900">{count}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="dash-card p-4 bg-white flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search by name, email, or institute…"
              className="form-input pl-10 h-10 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="input-search-users"
            />
          </div>
          <select
            className="form-input w-auto text-xs"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            id="select-role-filter"
          >
            <option value="ALL">All Roles</option>
            <option value="INSTITUTE_OWNER">Institute Owner</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="TEACHER">Teacher</option>
            <option value="PARENT">Parent</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        {/* Table */}
        <div className="dash-card overflow-hidden bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="text-sm">Loading users from database…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
              <p className="text-sm font-semibold">Failed to load users</p>
              <p className="text-xs text-gray-400">{error}</p>
              <button onClick={fetchUsers} className="btn-ghost text-xs mt-2">Try Again</button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Institute</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      {users.length === 0 ? "No users found in the database." : "No users match your filters."}
                    </td>
                  </tr>
                )}
                {filtered.map((u) => {
                  const RoleIcon = roleIcon[u.role];
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                            u.role === "TEACHER" ? "bg-gradient-to-br from-amber-400 to-orange-600" :
                            u.role === "PARENT" ? "bg-gradient-to-br from-teal-400 to-cyan-600" :
                            "bg-gradient-primary"
                          )}>
                            {getInitials(u.name)}
                          </div>
                          <p className="font-medium text-gray-900 text-sm whitespace-nowrap">{u.name}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />{u.email}
                        </div>
                      </td>
                      <td>
                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold", roleStyles[u.role])}>
                          <RoleIcon className="h-3 w-3" />
                          {u.role.replace(/_/g, " ")}
                        </div>
                      </td>
                      <td><span className="text-xs text-gray-600">{u.institute}</span></td>
                      <td><span className="text-xs text-gray-400">{u.createdAt}</span></td>
                      <td>
                        <span className={cn("pill text-[10px] py-0.5", u.isActive ? "pill-success" : "pill-danger")}>
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          {/* Eye button */}
                          <button
                            onClick={() => setViewingUser(u)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50 border border-transparent transition-colors"
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {/* Toggle active */}
                          <button
                            onClick={() => toggleActive(u.id)}
                            className={cn(
                              "p-1.5 rounded-lg border transition-colors",
                              u.isActive
                                ? "text-red-500 bg-red-50 hover:bg-red-100 border-red-200"
                                : "text-green-600 bg-green-50 hover:bg-green-100 border-green-200"
                            )}
                            title={u.isActive ? "Disable user" : "Enable user"}
                          >
                            {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                          </button>
                          {/* 3-dot menu */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent transition-colors"
                              title="More options"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                            {openMenuId === u.id && (
                              <UserActionsMenu
                                user={u}
                                onToggle={() => toggleActive(u.id)}
                                onView={() => setViewingUser(u)}
                                onClose={() => setOpenMenuId(null)}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
