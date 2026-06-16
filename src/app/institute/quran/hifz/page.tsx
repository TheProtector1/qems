import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HifzContent } from "@/components/institute/hifz-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Hifz Tracking" };

export default async function HifzPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Hifz Tracking"
      breadcrumbs={[{ label: "Quran Learning" }, { label: "Hifz Tracking" }]}
    >
      <HifzContent />
    </DashboardShell>
  );
}
