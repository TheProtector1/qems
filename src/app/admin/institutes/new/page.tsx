import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateInstituteForm } from "@/components/admin/create-institute-form";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Create New Institute – Super Admin" };

export default async function CreateInstitutePage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <DashboardShell
      title="Create New Institute"
      breadcrumbs={[
        { label: "Super Admin", href: "/admin/dashboard" },
        { label: "Institutes", href: "/admin/institutes" },
        { label: "New Institute" },
      ]}
    >
      <CreateInstituteForm />
    </DashboardShell>
  );
}
