import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ParentWorshipContent } from "@/components/parent/parent-worship-content";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "Spiritual Tracker - Parent Portal" };

export default async function ParentWorshipPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARENT") redirect("/dashboard");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });

  const students = parent?.students || [];

  return (
    <DashboardShell
      title="Daily Worship Tracker"
      breadcrumbs={[
        { label: "Parent Portal", href: "/parent/dashboard" },
        { label: "Spiritual Tracker" }
      ]}
    >
      <ParentWorshipContent students={students} />
    </DashboardShell>
  );
}
