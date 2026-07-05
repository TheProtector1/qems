import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AlumniContent } from "@/components/institute/alumni-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Alumni — QEMS" };

export default async function AlumniPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (!session.user.instituteId) redirect("/dashboard");

  return (
    <DashboardShell
      title="Alumni"
      breadcrumbs={[
        { label: "Students", href: "/institute/students" },
        { label: "Alumni" },
      ]}
    >
      <AlumniContent />
    </DashboardShell>
  );
}
