import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdminDashboardContent } from "@/components/admin/dashboard-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Super Admin Dashboard" };

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  
  const totalInstitutes = await prisma.institute.count({ where: { isApproved: true } });
  const activeStudents = await prisma.student.count({ where: { isActive: true } });
  const pendingInstitutesRaw = await prisma.institute.findMany({ 
    where: { isApproved: false },
    include: {
      subscription: {
        include: { planConfig: true }
      }
    }
  });

  const pendingInstitutes = pendingInstitutesRaw.map((inst: any) => ({
    id: inst.id,
    name: inst.name,
    director: inst.directorName || "N/A",
    email: inst.email,
    phone: inst.phone || "N/A",
    requestedAt: inst.createdAt.toISOString().split('T')[0],
    plan: inst.subscription?.planConfig?.name || "Trial",
  }));

  return (
    <DashboardShell title="Super Admin Dashboard" breadcrumbs={[{ label: "System Admin" }, { label: "Dashboard" }]}>
      <AdminDashboardContent 
        initialPendingList={pendingInstitutes} 
        initialTotalInstitutes={totalInstitutes}
        initialActiveStudents={activeStudents}
      />
    </DashboardShell>
  );
}
