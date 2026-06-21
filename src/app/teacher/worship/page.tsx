import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherWorshipContent } from "@/components/teacher/teacher-worship-content";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = { title: "Student Spiritual Tracking - Teacher Portal" };

export default async function TeacherWorshipPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "TEACHER") redirect("/dashboard");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        where: { isActive: true },
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });

  const students = teacher?.students || [];

  return (
    <DashboardShell
      title="Student Spiritual Tracker"
      breadcrumbs={[
        { label: "Teacher Portal", href: "/teacher/dashboard" },
        { label: "Spiritual Tracker" }
      ]}
    >
      <TeacherWorshipContent students={students} />
    </DashboardShell>
  );
}
