import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentsContent } from "@/components/institute/students-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Students" };

export default async function StudentsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Students"
      breadcrumbs={[{ label: "Institute" }, { label: "Students" }]}
    >
      <StudentsContent />
    </DashboardShell>
  );
}
