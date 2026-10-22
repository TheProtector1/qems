import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherWorshipContent } from "@/components/teacher/teacher-worship-content";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTeacherScope } from "@/lib/teacher-scope";

export const metadata = { title: "Student Spiritual Tracking - Teacher Portal" };

export default async function TeacherWorshipPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  if (session.user.role !== "TEACHER") redirect("/dashboard");

  const instituteId = session.user.instituteId;
  if (!instituteId) redirect("/dashboard");

  const teacherScope = await getTeacherScope(session.user.id, instituteId);

  const students = teacherScope.teacher
    ? await prisma.student.findMany({
        where: {
          AND: [
            { instituteId, isActive: true },
            teacherScope.studentWhere,
          ],
        },
        select: {
          id: true,
          fullName: true,
        },
        orderBy: { fullName: "asc" },
      })
    : [];

  return (
    <DashboardShell
      title="Student Spiritual Tracker"
      breadcrumbs={[
        { label: "Teacher Portal", href: "/teacher/dashboard" },
        { label: "Spiritual Tracker" },
      ]}
    >
      <TeacherWorshipContent students={students} />
    </DashboardShell>
  );
}
