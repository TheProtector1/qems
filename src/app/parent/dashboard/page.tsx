import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentDashboardContent } from "@/components/parent/parent-dashboard";
import { getAuthSession } from "@/lib/auth";
import { getParentChildrenViewData } from "@/lib/parent-portal-data";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "Parent Portal — QEMS" };

const TYPE_ICONS: Record<string, string> = {
  ABSENCE: "📅",
  FEE_DUE: "💰",
  LOW_PERFORMANCE: "📚",
  ACHIEVEMENT: "🏆",
  ANNOUNCEMENT: "📢",
  MESSAGE: "💬",
  GENERAL: "🔔",
};

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatMonthLabel(month: string | null, dueDate: Date) {
  if (month) {
    const [y, m] = month.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" });
  }
  return dueDate.toLocaleDateString("en-PK", { month: "long", year: "numeric" });
}

export default async function ParentDashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const [childrenData, parent, notifications] = await Promise.all([
    getParentChildrenViewData(session.user.id),
    prisma.parent.findUnique({
      where: { userId: session.user.id },
      include: { students: { select: { id: true } } },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const studentIds = parent?.students.map((s) => s.id) ?? [];
  const payments = studentIds.length
    ? await prisma.feePayment.findMany({
        where: { studentId: { in: studentIds } },
        orderBy: [{ dueDate: "desc" }],
      })
    : [];

  const feesByStudent: Record<string, { month: string; amount: number; status: string; dueDate: string }[]> = {};
  for (const p of payments) {
    if (!feesByStudent[p.studentId]) feesByStudent[p.studentId] = [];
    feesByStudent[p.studentId].push({
      month: formatMonthLabel(p.month, p.dueDate),
      amount: Number(p.netAmount),
      status: p.status === "PAID" ? "PAID" : "DUE",
      dueDate: p.dueDate.toISOString().slice(0, 10),
    });
  }

  return (
    <DashboardShell title="Parent Portal" breadcrumbs={[{ label: "My Child's Progress" }]}>
      <ParentDashboardContent
        childrenData={childrenData}
        feesByStudent={feesByStudent}
        notifications={notifications.map((n) => ({
          icon: TYPE_ICONS[n.type] || "🔔",
          msg: n.message,
          time: timeAgo(n.createdAt),
        }))}
      />
    </DashboardShell>
  );
}
