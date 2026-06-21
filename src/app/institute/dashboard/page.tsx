import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InstituteDashboardContent } from "@/components/institute/dashboard-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Institute Dashboard" };

export default async function InstituteDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const instituteId = session.user.instituteId;
  if (!instituteId) redirect("/dashboard");

  const totalStudents = await prisma.student.count({ 
    where: { instituteId, isActive: true } 
  });
  
  const activeTeachers = await prisma.teacher.count({ 
    where: { instituteId, isActive: true } 
  });

  return (
    <DashboardShell
      title="Dashboard"
      breadcrumbs={[{ label: "Institute" }, { label: "Dashboard" }]}
    >
      <InstituteDashboardContent 
        initialTotalStudents={totalStudents}
        initialActiveTeachers={activeTeachers}
      />
    </DashboardShell>
  );
}
