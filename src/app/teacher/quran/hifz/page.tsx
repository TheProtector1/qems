import { DashboardShell } from "@/components/layout/dashboard-shell";
import { HifzContent } from "@/components/institute/hifz-content";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Hifz Progress - Teacher Portal" };

export default async function TeacherHifzPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Hifz Tracking"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Quran Hifz" }]}
    >
      <HifzContent />
    </DashboardShell>
  );
}
