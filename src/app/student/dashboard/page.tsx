import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StudentDashboardContent } from "@/components/student/student-dashboard";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSurahName } from "@/lib/utils";

export const metadata = { title: "Student Dashboard" };

function computeStreak(dates: string[]) {
  if (!dates.length) return 0;
  const presentSet = new Set(dates);
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 120; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (presentSet.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export default async function StudentDashboard() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");
  const userId = session.user.id;

  const student = await prisma.student.findUnique({
    where: { userId },
    include: {
      enrollments: {
        include: { class: true },
        where: { isActive: true },
      },
      hifzRecords: {
        orderBy: { date: "desc" },
        take: 1,
      },
      badges: { include: { badge: true }, orderBy: { earnedAt: "desc" }, take: 6 },
      attendance: {
        where: { status: { in: ["PRESENT", "LATE"] } },
        orderBy: { date: "desc" },
        take: 120,
        select: { date: true },
      },
    },
  });

  const avgRating = student
    ? await prisma.hifzRecord.aggregate({
        where: { studentId: student.id },
        _avg: { rating: true },
      })
    : null;

  const streak = student
    ? computeStreak(student.attendance.map((a) => a.date.toISOString().slice(0, 10)))
    : 0;

  const latestLesson = student?.hifzRecords[0];
  const todayLesson = latestLesson
    ? {
        type: latestLesson.type,
        surah: latestLesson.surahName || getSurahName(latestLesson.surahNumber),
        ayahFrom: latestLesson.ayahFrom,
        ayahTo: latestLesson.ayahTo,
        rating: latestLesson.rating,
        date: latestLesson.date.toLocaleDateString("en-PK", { day: "numeric", month: "short" }),
        note: latestLesson.teacherNote,
      }
    : null;

  const badges = (student?.badges || []).map((sb) => ({
    icon: sb.badge.icon,
    name: sb.badge.name,
    date: sb.earnedAt.toLocaleDateString("en-PK", { month: "short", day: "numeric" }),
    color: "from-primary-500 to-emerald-600",
  }));

  return (
    <DashboardShell title="My Progress" breadcrumbs={[{ label: "Student Portal" }]}>
      <StudentDashboardContent
        initialStudent={
          student
            ? {
                name: student.fullName,
                currentJuz: student.currentJuz,
                currentPara: student.currentPara ?? student.currentJuz,
                hifzDirection: student.hifzDirection,
                streak,
                quality: avgRating?._avg.rating ? Number((avgRating._avg.rating * 2).toFixed(1)) : 0,
                enrollments: student.enrollments,
                todayLesson,
                badges,
              }
            : null
        }
      />
    </DashboardShell>
  );
}
