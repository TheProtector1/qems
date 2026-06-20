import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentQuranProgress } from "@/components/parent/parent-quran-progress";
import { getAuthSession } from "@/lib/auth";
import { getParentChildrenViewData } from "@/lib/parent-portal-data";
import { redirect } from "next/navigation";

export const metadata = { title: "Hifz Progress - Parent Portal" };

export default async function ParentHifzPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const childrenData = await getParentChildrenViewData(session.user.id);

  return (
    <DashboardShell
      title="Hifz Memorization Progress"
      breadcrumbs={[{ label: "Parent Portal", href: "/parent/dashboard" }, { label: "Hifz Progress" }]}
    >
      <ParentQuranProgress childrenData={childrenData} />
    </DashboardShell>
  );
}
