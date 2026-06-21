import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherDashboardContent } from "@/components/teacher/teacher-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Teacher Portal - QEMS" };

export default async function TeacherDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const userId = session.user.id;

  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: {
      classes: true,
      students: {
        where: { isActive: true },
        select: {
          id: true,
          fullName: true,
          programType: true,
          currentJuz: true,
        }
      }
    }
  });

  const students = teacher?.students.map((s: any) => ({
    id: s.id,
    name: s.fullName,
    program: s.programType,
    class: "N/A", // This could be mapped from enrollment, but keeping simple for now to remove mock data
    currentJuz: s.currentJuz,
    lastType: "N/A",
    lastSurah: "N/A",
    lastAyahs: "N/A",
    status: "Active",
    rating: 0
  })) || [];

  const classes = teacher?.classes.map((c: any) => ({
    id: c.id,
    name: c.name,
    program: c.programType,
    studentsCount: c.capacity, // Using capacity as placeholder if enrollment not fetched
    time: "N/A" // Schedule not parsed
  })) || [];

  return (
    <DashboardShell
      title="Teacher Hub"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Dashboard" }]}
    >
      <TeacherDashboardContent initialStudents={students} initialClasses={classes} />
    </DashboardShell>
  );
}
