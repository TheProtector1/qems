import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TajweedContent } from "@/components/institute/tajweed-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Tajweed Learning Module" };

export default async function TajweedPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Tajweed Module"
      breadcrumbs={[{ label: "Quran Learning" }, { label: "Tajweed Module" }]}
    >
      <TajweedContent />
    </DashboardShell>
  );
}
