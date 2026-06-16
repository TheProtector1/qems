import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NazraContent } from "@/components/institute/nazra-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Nazra Quran Tracking" };

export default async function NazraPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Nazra Tracking"
      breadcrumbs={[{ label: "Quran Learning" }, { label: "Nazra Tracking" }]}
    >
      <NazraContent />
    </DashboardShell>
  );
}
