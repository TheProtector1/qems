import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ClassesContent } from "@/components/institute/classes-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Classes — QEMS" };

export default async function ClassesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Classes & Sections"
      breadcrumbs={[{ label: "Students", href: "/institute/students" }, { label: "Classes" }]}
    >
      <ClassesContent />
    </DashboardShell>
  );
}
