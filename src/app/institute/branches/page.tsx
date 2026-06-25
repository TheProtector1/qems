import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BranchesContent } from "@/components/institute/branches-content";

export const metadata = { title: "Branches - Institute Portal" };

export default async function InstituteBranchesPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Branches"
      breadcrumbs={[{ label: "Institute" }, { label: "Branches" }]}
    >
      <BranchesContent />
    </DashboardShell>
  );
}
