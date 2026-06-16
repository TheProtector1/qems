"use client";

import { useState } from "react";
import {
  Users, Search, Filter, Shield, ShieldOff,
  Building2, GraduationCap, BookOpen, MoreHorizontal,
  UserCheck, UserX, Mail,
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

const MOCK_USERS: PlatformUser[] = [
  { id: "u1", name: "Mufti Asim", email: "mufti.asim@darululoom.edu", role: "INSTITUTE_OWNER", institute: "Dar ul Uloom Karachi", isActive: true, createdAt: "Jun 01, 2025" },
  { id: "u2", name: "Farhat Hashmi", email: "farhat@alhuda.org", role: "INSTITUTE_OWNER", institute: "Al-Huda International", isActive: true, createdAt: "May 20, 2025" },
  { id: "u3", name: "Qari Hamid", email: "hamid@darululoom.edu", role: "TEACHER", institute: "Dar ul Uloom Karachi", isActive: true, createdAt: "Jun 05, 2025" },
  { id: "u4", name: "Raza Khan", email: "raza.khan@gmail.com", role: "PARENT", institute: "Dar ul Uloom Karachi", isActive: true, createdAt: "Jun 10, 2025" },
  { id: "u5", name: "Dr. Abdur Rahman", email: "contact@alazhar.edu", role: "INSTITUTE_OWNER", institute: "Al-Azhar Tajweed Institute", isActive: false, createdAt: "Jun 12, 2026" },
  { id: "u6", name: "Ustaza Rukhsar", email: "rukhsar@alhuda.org", role: "TEACHER", institute: "Al-Huda International", isActive: true, createdAt: "May 25, 2025" },
  { id: "u7", name: "Noor Hussain", email: "noor.h@gmail.com", role: "PARENT", institute: "Al-Huda International", isActive: true, createdAt: "Jun 01, 2025" },
  { id: "u8", name: "Ahmad Raza Khan", email: "ahmad.raza@student.com", role: "STUDENT", institute: "Dar ul Uloom Karachi", isActive: true, createdAt: "Jun 01, 2025" },
];

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

export function AdminUsersContent() {
  const [users, setUsers] = useState<PlatformUser[]>(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const toggleActive = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.institute.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
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
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium">
            {users.length} Total Users
          </span>
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {(["ALL", "INSTITUTE_OWNER", "TEACHER", "PARENT", "STUDENT", "BRANCH_MANAGER"] as const).map((r) => {
          const count = r === "ALL" ? users.length : users.filter((u) => u.role === r).length;
          const label = r === "ALL" ? "All" : r.replace("_", " ").replace(/\b\w/g, l => l);
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
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No users found.</td>
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
                      <Mail className="h-3 w-3" />
                      {u.email}
                    </div>
                  </td>
                  <td>
                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold", roleStyles[u.role])}>
                      <RoleIcon className="h-3 w-3" />
                      {u.role.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-gray-600">{u.institute}</span>
                  </td>
                  <td>
                    <span className="text-xs text-gray-400">{u.createdAt}</span>
                  </td>
                  <td>
                    <span className={cn("pill text-[10px] py-0.5", u.isActive ? "pill-success" : "pill-danger")}>
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1.5">
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
                      <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 border border-transparent transition-colors" title="More options">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
