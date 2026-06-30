"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  ClipboardList, DollarSign, MessageSquare, BarChart3, Settings,
  Building2, Shield, Bell, LogOut, ChevronRight, Star, Menu, X,
  Award, UserCheck, GitBranch, HeartHandshake, CreditCard, FileText,
  Sparkles, Calendar, Gift, Palmtree,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavItem[];
}

const instituteNav: NavItem[] = [
  { label: "Dashboard", href: "/institute/dashboard", icon: LayoutDashboard },
  {
    label: "Students",
    href: "/institute/students",
    icon: GraduationCap,
    children: [
      { label: "All Students", href: "/institute/students", icon: Users },
      { label: "Admissions", href: "/institute/students/admissions", icon: ClipboardList },
      { label: "Classes", href: "/institute/students/classes", icon: Building2 },
    ],
  },
  {
    label: "Quran Learning",
    href: "/institute/quran",
    icon: BookOpen,
    children: [
      { label: "Hifz Tracking", href: "/institute/quran/hifz", icon: Star },
      { label: "Nazra Tracking", href: "/institute/quran/nazra", icon: BookOpen },
      { label: "Tajweed Module", href: "/institute/quran/tajweed", icon: Award },
    ],
  },
  { label: "Attendance", href: "/institute/attendance", icon: CalendarCheck },
  { label: "Holidays", href: "/institute/holidays", icon: Palmtree },
  { label: "Student Reports", href: "/institute/reports", icon: FileText },
  { label: "Assessments", href: "/institute/assessments", icon: ClipboardList },
  {
    label: "Finance",
    href: "/institute/finance",
    icon: DollarSign,
    children: [
      { label: "Fee Management", href: "/institute/finance/fees", icon: DollarSign },
      { label: "Salaries", href: "/institute/finance/salaries", icon: CreditCard },
      { label: "Scholarships", href: "/institute/finance/scholarships", icon: HeartHandshake },
      { label: "Sponsors & Donations", href: "/institute/finance/sponsors", icon: Gift },
      { label: "Reports", href: "/institute/finance/reports", icon: BarChart3 },
    ],
  },
  { label: "Teachers", href: "/institute/teachers", icon: UserCheck },
  { label: "Branches", href: "/institute/branches", icon: GitBranch },
  { label: "Communication", href: "/institute/communication", icon: MessageSquare },
  { label: "Character Building", href: "/institute/character-building", icon: HeartHandshake },
  { label: "Calendar", href: "/institute/calendar", icon: Calendar },
  { label: "Analytics", href: "/institute/analytics", icon: BarChart3 },
  { label: "My Profile", href: "/profile", icon: Settings },
  { label: "Safeguarding", href: "/institute/safeguarding", icon: Shield },
  { label: "Profile Approvals", href: "/institute/profile-requests", icon: UserCheck },
  { label: "Settings", href: "/institute/settings", icon: Settings },
];

const superAdminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Institutes", href: "/admin/institutes", icon: Building2 },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Students", href: "/admin/students", icon: GraduationCap },
  { label: "My Profile", href: "/profile", icon: Settings },
  { label: "Student Reports", href: "/admin/reports", icon: FileText },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Announcements", href: "/admin/announcements", icon: Bell },
  { label: "Support Tickets", href: "/admin/support", icon: Shield },
  { label: "Profile Approvals", href: "/admin/profile-requests", icon: UserCheck },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "My Students", href: "/teacher/students", icon: GraduationCap },
  { label: "My Classes", href: "/teacher/classes", icon: Building2 },
  { label: "Attendance Entry", href: "/teacher/attendance", icon: CalendarCheck },
  { label: "Student Reports", href: "/teacher/reports", icon: FileText },
  { label: "Hifz Records", href: "/teacher/quran/hifz", icon: Star },
  { label: "Assessments", href: "/teacher/assessments", icon: ClipboardList },
  { label: "Character Building", href: "/teacher/character-building", icon: HeartHandshake },
  { label: "Communication", href: "/teacher/communication", icon: MessageSquare },
  { label: "Calendar", href: "/teacher/calendar", icon: Calendar },
  { label: "My Profile", href: "/profile", icon: Settings },
  { label: "Spiritual Tracker", href: "/teacher/worship", icon: Sparkles },
];

const branchNav: NavItem[] = [
  { label: "Dashboard", href: "/branch/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/teacher/students", icon: GraduationCap },
  { label: "Attendance", href: "/teacher/attendance", icon: CalendarCheck },
  { label: "Hifz Records", href: "/teacher/quran/hifz", icon: Star },
  { label: "Assessments", href: "/teacher/assessments", icon: ClipboardList },
  { label: "Communication", href: "/teacher/communication", icon: MessageSquare },
  { label: "My Profile", href: "/profile", icon: Settings },
];

const parentNav: NavItem[] = [
  { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
  { label: "Hifz Progress", href: "/parent/quran/hifz", icon: BookOpen },
  { label: "Nazra Progress", href: "/parent/quran/nazra", icon: BookOpen },
  { label: "Tajweed Progress", href: "/parent/quran/tajweed", icon: Star },
  { label: "Attendance", href: "/parent/attendance", icon: CalendarCheck },
  { label: "Character Building", href: "/parent/character-building", icon: HeartHandshake },
  { label: "Exam Results", href: "/parent/assessments", icon: ClipboardList },
  { label: "Fees & Payments", href: "/parent/fees", icon: DollarSign },
  { label: "Messaging", href: "/parent/communication", icon: MessageSquare },
  { label: "Spiritual Tracker", href: "/parent/worship", icon: Sparkles },
  { label: "Calendar", href: "/parent/calendar", icon: Calendar },
  { label: "My Profile", href: "/profile", icon: Settings },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Quran Hifz Map", href: "/student/quran/hifz", icon: BookOpen },
  { label: "Nazra Progress", href: "/student/quran/nazra", icon: BookOpen },
  { label: "Tajweed Progress", href: "/student/quran/tajweed", icon: Star },
  { label: "Achievements", href: "/student/achievements", icon: Award },
  { label: "My Attendance", href: "/student/attendance", icon: CalendarCheck },
  { label: "Spiritual Tracker", href: "/student/worship", icon: Sparkles },
  { label: "Calendar", href: "/student/calendar", icon: Calendar },
  { label: "My Profile", href: "/profile", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavItemRow({
  item,
  collapsed,
  depth = 0,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  depth?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(
    item.children?.some((c) => pathname.startsWith(c.href)) ?? false
  );
  const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href));
  const Icon = item.icon;

  if (item.children && !collapsed) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "nav-item w-full",
            isActive ? "nav-item-active" : "nav-item-inactive",
            depth > 0 && "ml-4"
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
          {!collapsed && (
            <ChevronRight
              className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
            />
          )}
        </button>
        {open && (
          <div className="ml-2 mt-1 space-y-0.5 border-l border-primary-100 pl-3">
            {item.children.map((child) => (
              <NavItemRow
                key={child.href}
                item={child}
                collapsed={collapsed}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "nav-item",
        isActive ? "nav-item-active" : "nav-item-inactive",
        depth > 0 && "text-xs py-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="pill pill-gold text-[10px] px-2 py-0.5">{item.badge}</span>
      )}
    </Link>
  );
}

export function Sidebar({ collapsed, onCollapse, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNavigate = () => onMobileClose?.();

  useEffect(() => {
    if (session?.user?.image) {
      setProfileImage(session.user.image);
    } else if (session?.user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => { if (data.image) setProfileImage(data.image); })
        .catch(console.error);
    }
  }, [session]);

  let currentNav = instituteNav;
  if (role === "SUPER_ADMIN") {
    currentNav = superAdminNav;
  } else if (role === "BRANCH_MANAGER") {
    currentNav = branchNav;
  } else if (role === "TEACHER") {
    currentNav = teacherNav;
  } else if (role === "PARENT") {
    currentNav = parentNav;
  } else if (role === "STUDENT") {
    currentNav = studentNav;
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-r border-border transition-transform duration-300 z-50",
        "fixed inset-y-0 left-0 w-72 max-w-[85vw] lg:static lg:max-w-none lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        collapsed ? "lg:w-16" : "lg:w-64"
      )}
    >
      <div className="flex items-center gap-3 px-4 h-14 sm:h-16 border-b border-border">
        <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
          <span className="text-white text-sm font-bold font-arabic">ق</span>
        </div>
        {(!collapsed || mobileOpen) && (
          <span className="font-display font-bold text-primary-900 text-lg">QEMS</span>
        )}
        <button
          onClick={() => onMobileClose?.()}
          className="ml-auto p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          onClick={() => onCollapse(!collapsed)}
          className="ml-auto p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors hidden lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {(!collapsed || mobileOpen) && session?.user?.instituteName && (
        <div className="mx-3 mt-3 rounded-xl bg-primary-50 border border-primary-100 px-3 py-2">
          <p className="text-[10px] text-primary-500 font-medium uppercase tracking-wide">Institute</p>
          <p className="text-primary-900 font-semibold text-sm truncate">
            {session.user.instituteName}
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 no-scrollbar">
        {currentNav.map((item) => (
          <NavItemRow
            key={item.href}
            item={item}
            collapsed={collapsed && !mobileOpen}
            onNavigate={handleNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        {(!collapsed || mobileOpen) ? (
          <div className="flex items-center gap-3">
            {profileImage ? (
              <img src={profileImage} alt="User Avatar" className="h-9 w-9 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">
                  {session?.user?.name ? getInitials(session.user.name) : "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center justify-center p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
