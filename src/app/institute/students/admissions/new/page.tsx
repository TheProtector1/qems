import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdmissionForm } from "@/components/institute/admission-form";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "New Admission — QEMS" };

export default async function NewAdmissionPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="New Admission"
      breadcrumbs={[
        { label: "Students", href: "/institute/students" },
        { label: "Admissions", href: "/institute/students/admissions" },
        { label: "New" },
      ]}
    >
      <AdmissionForm />
    </DashboardShell>
  );
}
