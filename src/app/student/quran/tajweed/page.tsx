import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TajweedContent } from "@/components/institute/tajweed-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Tajweed Progress - Student Portal" };

export default async function StudentTajweedPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell title="Tajweed Progress" breadcrumbs={[{ label: "Student Portal" }, { label: "Tajweed" }]}>
      <TajweedContent readOnly apiBase="/api/student/tajweed" />
    </DashboardShell>
  );
}
