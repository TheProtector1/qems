import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AdmissionForm } from "@/components/institute/admission-form";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Add New Student — QEMS" };

export default async function NewStudentPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Add New Student"
      breadcrumbs={[
        { label: "Students", href: "/institute/students" },
        { label: "Add New" },
      ]}
    >
      <AdmissionForm />
    </DashboardShell>
  );
}
