import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NazraContent } from "@/components/institute/nazra-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Nazra Progress - Parent Portal" };

export default async function ParentNazraPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell title="Nazra Progress" breadcrumbs={[{ label: "Parent Portal" }, { label: "Nazra" }]}>
      <NazraContent readOnly apiBase="/api/parent/nazra" />
    </DashboardShell>
  );
}
