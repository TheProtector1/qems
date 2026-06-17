"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Search, Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function Topbar({ title, breadcrumbs }: TopbarProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    INSTITUTE_OWNER: "Institute Owner",
    BRANCH_MANAGER: "Branch Manager",
    TEACHER: "Teacher",
    PARENT: "Parent",
    STUDENT: "Student",
  };

  return (
    <header className="h-16 bg-white border-b border-border px-6 flex items-center gap-4 sticky top-0 z-40">
      {/* Page Title / Breadcrumbs */}
      <div className="flex-1">
        {breadcrumbs ? (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-gray-300">/</span>}
                {b.href ? (
                  <a href={b.href} className="text-gray-500 hover:text-primary-700 transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="font-semibold text-gray-900">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="font-semibold text-gray-900 text-lg">{title}</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-xl text-gray-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          title="Search"
          id="btn-search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-xl text-gray-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          title="Toggle theme"
          id="btn-theme-toggle"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-gray-500 hover:text-primary-700 hover:bg-primary-50 transition-colors"
            title="Notifications"
            id="btn-notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card-hover border border-border overflow-hidden z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button className="text-xs text-primary-700 font-medium">Mark all read</button>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {[
                  { icon: "📚", msg: "Ahmad scored 9.2 on today's Sabaq", time: "5m ago", unread: true },
                  { icon: "⚠️", msg: "3 students absent from Class A today", time: "1h ago", unread: true },
                  { icon: "💰", msg: "Fee payment received from Usman Khan", time: "2h ago", unread: false },
                  { icon: "🏆", msg: "Fatima earned 'First Juz Complete' badge", time: "3h ago", unread: false },
                ].map((n, i) => (
                  <div key={i} className={cn("flex gap-3 p-4 hover:bg-gray-50 cursor-pointer", n.unread && "bg-primary-50/40")}>
                    <span className="text-xl">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{n.msg}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                    </div>
                    {n.unread && <span className="h-2 w-2 rounded-full bg-primary-600 flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border">
                <button className="w-full text-center text-xs text-primary-700 font-semibold hover:text-primary-900">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-border cursor-pointer hover:bg-gray-50 rounded-xl px-3 py-1.5 transition-colors">
          <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {session?.user?.name ? getInitials(session.user.name) : "U"}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-900 leading-tight">
              {session?.user?.name?.split(" ")[0]}
            </p>
            <p className="text-[10px] text-gray-400 leading-tight">
              {session?.user?.role ? roleLabel[session.user.role] : ""}
            </p>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
