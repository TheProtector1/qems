import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TajweedContent } from "@/components/institute/tajweed-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Tajweed Progress - Parent Portal" };

export default async function ParentTajweedPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell title="Tajweed Progress" breadcrumbs={[{ label: "Parent Portal" }, { label: "Tajweed" }]}>
      <TajweedContent readOnly apiBase="/api/parent/tajweed" />
    </DashboardShell>
  );
}
