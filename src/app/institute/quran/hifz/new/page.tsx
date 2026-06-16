import { DashboardShell } from "@/components/layout/dashboard-shell";
import { NewHifzForm } from "@/components/institute/new-hifz-form";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Record Hifz Lesson — QEMS" };

export default async function NewHifzPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  return (
    <DashboardShell
      title="Record Hifz Lesson"
      breadcrumbs={[
        { label: "Quran Learning", href: "/institute/quran/hifz" },
        { label: "Hifz Tracking", href: "/institute/quran/hifz" },
        { label: "Record Lesson" }
      ]}
    >
      <NewHifzForm />
    </DashboardShell>
  );
}
