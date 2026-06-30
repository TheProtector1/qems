import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NazraContent } from "@/components/institute/nazra-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Nazra Progress - Student Portal" };

export default async function StudentNazraPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell title="Nazra Progress" breadcrumbs={[{ label: "Student Portal" }, { label: "Nazra" }]}>
      <NazraContent readOnly apiBase="/api/student/nazra" />
    </DashboardShell>
  );
}
