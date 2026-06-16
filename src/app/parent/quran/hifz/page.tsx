import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HifzContent } from "@/components/institute/hifz-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Hifz Progress - Parent Portal" };

export default async function ParentHifzPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Hifz Memorization Progress"
      breadcrumbs={[{ label: "Parent Portal" }, { label: "Hifz Progress" }]}
    >
      <HifzContent />
    </DashboardShell>
  );
}
