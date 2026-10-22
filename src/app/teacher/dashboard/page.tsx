import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TeacherDashboardContent } from "@/components/teacher/teacher-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTeacherScope } from "@/lib/teacher-scope";

export const metadata = { title: "Teacher Portal - QEMS" };

export default async function TeacherDashboardPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const userId = session.user.id;
  const instituteId = session.user.instituteId;

  if (!instituteId) redirect("/auth/login");

  const teacherScope = await getTeacherScope(userId, instituteId);
  const teacher = teacherScope.teacher;

  const [classesData, studentsData] = await Promise.all([
    teacher
      ? prisma.class.findMany({
          where: { teacherId: teacher.id, instituteId },
          include: {
            _count: { select: { enrollments: true } },
          },
          orderBy: { name: "asc" },
        })
      : [],
    teacher
      ? prisma.student.findMany({
          where: {
            AND: [
              { instituteId, isActive: true },
              teacherScope.studentWhere,
            ],
          },
          select: {
            id: true,
            fullName: true,
            programType: true,
            currentJuz: true,
            enrollments: {
              include: { class: true },
              where: { isActive: true },
              take: 1,
            },
            hifzRecords: {
              orderBy: { date: "desc" },
              take: 1,
              select: {
                type: true,
                surahName: true,
                ayahFrom: true,
                ayahTo: true,
                rating: true,
              },
            },
          },
          orderBy: { fullName: "asc" },
        })
      : [],
  ]);

  const students = studentsData.map((s) => {
    const lastRecord = s.hifzRecords[0];
    return {
      id: s.id,
      name: s.fullName,
      program: s.programType,
      class: s.enrollments?.[0]?.class?.name || "Not Assigned",
      currentJuz: s.currentJuz,
      lastType: lastRecord?.type || "None",
      lastSurah: lastRecord?.surahName || "N/A",
      lastAyahs: lastRecord ? `${lastRecord.ayahFrom}-${lastRecord.ayahTo}` : "N/A",
      status: "Active",
      rating: lastRecord?.rating || 0,
    };
  });

  const classes = classesData.map((c) => ({
    id: c.id,
    name: c.name,
    program: c.programType,
    studentsCount: c._count?.enrollments || 0,
    time: "Scheduled",
    meetingLink: c.meetingLink,
    meetingPlatform: c.meetingPlatform,
    meetingPassword: c.meetingPassword,
  }));

  return (
    <DashboardShell
      title="Teacher Hub"
      breadcrumbs={[{ label: "Teacher Portal" }, { label: "Dashboard" }]}
    >
      <TeacherDashboardContent initialStudents={students} initialClasses={classes} />
    </DashboardShell>
  );
}
