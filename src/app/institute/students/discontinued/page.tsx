import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DiscontinuedStudentsContent } from "@/components/institute/discontinued-students-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Dismissed & Discontinued Students — QEMS" };

export default async function DiscontinuedStudentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (!session.user.instituteId && session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Dismissed & Discontinued"
      breadcrumbs={[
        { label: "Students", href: "/institute/students" },
        { label: "Dismissed & Discontinued" },
      ]}
    >
      <DiscontinuedStudentsContent />
    </DashboardShell>
  );
}
