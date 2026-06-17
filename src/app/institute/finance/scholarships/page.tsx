import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScholarshipsPageContent } from "@/components/institute/scholarships-page-content";

export const metadata = { title: "Scholarships & Discounts — QEMS" };

export default async function ScholarshipsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  return (
    <DashboardShell
      title="Scholarships & Discounts"
      breadcrumbs={[
        { label: "Finance", href: "/institute/finance/fees" },
        { label: "Scholarships" }
      ]}
    >
      <ScholarshipsPageContent />
    </DashboardShell>
  );
}
