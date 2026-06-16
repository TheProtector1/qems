"use client";

import { useState } from "react";
import {
  Building2, Users, CreditCard, AlertCircle, CheckCircle, XCircle,
  TrendingUp, BarChart3, Bell, ArrowUpRight, ArrowDownRight,
  MoreHorizontal, Plus, ShieldCheck, Mail, Phone,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

const stats = [
  {
    label: "Total Institutes",
    value: "142",
    change: "+8",
    changePct: "this month",
    up: true,
    icon: Building2,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    label: "Active Students",
    value: "12,480",
    change: "+620",
    changePct: "vs last month",
    up: true,
    icon: Users,
    bg: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    label: "Monthly Recurring Revenue",
    value: "PKR 490K",
    change: "+12.4%",
    changePct: "growth",
    up: true,
    icon: CreditCard,
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    label: "Pending Approvals",
    value: "5",
    change: "Requires action",
    changePct: "",
    up: false,
    icon: AlertCircle,
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
];

const revenueData = [
  { month: "Jan", revenue: 320000, institutes: 110 },
  { month: "Feb", revenue: 350000, institutes: 115 },
  { month: "Mar", revenue: 390000, institutes: 122 },
  { month: "Apr", revenue: 420000, institutes: 128 },
  { month: "May", revenue: 450000, institutes: 134 },
  { month: "Jun", revenue: 490000, institutes: 142 },
];

const planData = [
  { name: "Starter (Free)", value: 85, color: "#94A3B8" },
  { name: "Growth (Paid)", value: 48, color: "#1B5E20" },
  { name: "Enterprise (Custom)", value: 9, color: "#D4AF37" },
];

interface PendingInstitute {
  id: string;
  name: string;
  director: string;
  email: string;
  phone: string;
  requestedAt: string;
  plan: string;
}

const mockPending: PendingInstitute[] = [
  {
    id: "inst_1",
    name: "Al-Azhar Tajweed Institute",
    director: "Dr. Abdur Rahman",
    email: "contact@alazhar.edu",
    phone: "+92 300 1234567",
    requestedAt: "2026-06-12",
    plan: "Growth",
  },
  {
    id: "inst_2",
    name: "Minhaj Quran School",
    director: "Mohammad Ali",
    email: "info@minhajquran.org",
    phone: "+92 312 9876543",
    requestedAt: "2026-06-14",
    plan: "Starter",
  },
  {
    id: "inst_3",
    name: "Noor-ul-Huda Hifz Center",
    director: "Qari Ahmad Raza",
    email: "noorulhuda@gmail.com",
    phone: "+92 321 4567890",
    requestedAt: "2026-06-15",
    plan: "Growth",
  },
];

export function AdminDashboardContent() {
  const [pendingList, setPendingList] = useState<PendingInstitute[]>(mockPending);
  const [approvedCount, setApprovedCount] = useState(142);

  const handleApprove = (id: string) => {
    setPendingList(pendingList.filter((inst) => inst.id !== id));
    setApprovedCount((prev) => prev + 1);
  };

  const handleReject = (id: string) => {
    setPendingList(pendingList.filter((inst) => inst.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            Welcome to the Control Center ⚙️
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Overview of the entire QEMS ecosystem and operations.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/announcements/new" className="btn-ghost text-sm py-2">
            <Bell className="h-4 w-4" />
            System Broadcast
          </Link>
          <Link href="/admin/institutes" className="btn-primary text-sm py-2">
            <Building2 className="h-4 w-4" />
            Manage Tenants
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const isPendingCard = stat.label === "Pending Approvals";
          const displayValue = isPendingCard ? pendingList.length : (stat.label === "Total Institutes" ? approvedCount : stat.value);
          return (
            <div key={idx} className="kpi-card p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                  <Icon className={cn("h-6 w-6", stat.text)} />
                </div>
                <button className="text-gray-300 hover:text-gray-500 transition-colors">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-display font-bold text-gray-900">{displayValue}</h3>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                {stat.up ? (
                  <span className="text-green-600 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    {stat.change}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">
                    {stat.change}
                  </span>
                )}
                {stat.changePct && <span className="text-gray-400 font-normal">{stat.changePct}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Platform Growth */}
        <div className="lg:col-span-2 dash-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Platform Growth & Revenue</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months progression</p>
            </div>
            <span className="pill pill-success">PKR 490K MRR</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1B5E20" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#1B5E20" strokeWidth={2.5} fill="url(#revenueGrad)" name="Monthly Revenue (PKR)" />
              <Area type="monotone" dataKey="institutes" stroke="#D4AF37" strokeWidth={2} fill="none" strokeDasharray="4 2" name="Total Institutes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Plans */}
        <div className="dash-card p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Plan Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">Distribution of current tenants</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={planData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {planData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2.5 mt-4">
            {planData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-600">{p.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{p.value} ({Math.round(p.value / 1.42)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Tenant Registrations */}
      <div className="dash-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900">Tenant Registration Approvals</h3>
            <p className="text-xs text-gray-400 mt-0.5">Institutes requesting access to the platform</p>
          </div>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-full">
            {pendingList.length} Pending
          </span>
        </div>

        {pendingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <ShieldCheck className="h-12 w-12 text-primary-600 mb-3" />
            <p className="text-sm font-semibold text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-1">No new tenant registration approvals pending.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Institute Details</th>
                  <th className="py-3 px-4">Director Contact</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4">Plan Selected</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((inst) => (
                  <tr key={inst.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {inst.name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-950 font-medium">{inst.director}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {inst.email}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inst.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      {inst.requestedAt}
                    </td>
                    <td className="py-4 px-4">
                      <span className={cn(
                        "pill text-[10px] px-2.5 py-0.5",
                        inst.plan === "Growth" ? "pill-gold" : "pill-info"
                      )}>
                        {inst.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleReject(inst.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleApprove(inst.id)}
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Global Config Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* System Announcements */}
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">System Broadcasts</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary-50/50 border border-primary-100/50">
              <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">ACTIVE</span>
              <h4 className="text-sm font-semibold text-gray-900 mt-2">Planned Server Maintenance</h4>
              <p className="text-xs text-gray-500 mt-1">Scheduled for June 20, 2026, from 02:00 to 04:00 GMT. System might experience minor latency.</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">EXPIRED</span>
              <h4 className="text-sm font-semibold text-gray-700 mt-2">Welcome to QEMS v1.2</h4>
              <p className="text-xs text-gray-400 mt-1">Launched automatic Hifz Quality scoring metrics dashboard for all growth tier subscribers.</p>
            </div>
          </div>
        </div>

        {/* Global Platform Configuration */}
        <div className="dash-card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">System Configuration</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Tenant Registration Mode</p>
                <p className="text-xs text-gray-400">Approval needed before activation</p>
              </div>
              <span className="pill pill-success">MANUAL APPROVAL</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div>
                <p className="font-medium text-gray-900">Global Pricing Scheme</p>
                <p className="text-xs text-gray-400">Stripe Live payments configuration</p>
              </div>
              <span className="pill pill-info">STRIPE TEST MODE</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div>
                <p className="font-medium text-gray-900">Backup Retention Policy</p>
                <p className="text-xs text-gray-400">Daily database backups</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">30 DAYS ROLL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
