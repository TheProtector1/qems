import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeachersContent } from "@/components/institute/teachers-content";

export const metadata = { title: "Teachers - Institute Portal" };

export default async function InstituteTeachersPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Teachers Directory"
      breadcrumbs={[{ label: "Institute" }, { label: "Teachers" }]}
    >
      <TeachersContent />
    </DashboardShell>
  );
}
