import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Award, Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Achievements - Student Portal" };

export default async function StudentAchievementsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

  const student = await prisma.student.findFirst({
    where: { userId: session.user.id },
    include: {
      badges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
      institute: {
        include: {
          badges: { where: { isActive: true } },
        },
      },
      hifzQualityScores: { orderBy: { createdAt: "desc" }, take: 1 },
      attendance: {
        where: { status: "PRESENT" },
        orderBy: { date: "desc" },
        take: 100,
      },
    },
  });

  const earnedBadgeIds = new Set(student?.badges.map((b) => b.badgeId) || []);
  const allBadges = student?.institute?.badges || [];

  const badges = allBadges.map((b) => {
    const earned = student?.badges.find((sb) => sb.badgeId === b.id);
    return {
      icon: b.icon,
      name: b.name,
      desc: b.description || "",
      date: earned
        ? earned.earnedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null,
      earned: Boolean(earned),
      color: "from-primary-500 to-emerald-600",
    };
  });

  const earnedCount = badges.filter((b) => b.earned).length;
  const qualityScore = student?.hifzQualityScores[0]
    ? Number(student.hifzQualityScores[0].overallScore)
    : null;

  let streak = 0;
  if (student?.attendance.length) {
    const dates = student.attendance.map((a) => a.date.toISOString().slice(0, 10));
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dates.includes(d.toISOString().slice(0, 10))) streak++;
      else break;
    }
  }

  return (
    <DashboardShell
      title="Achievements & Badges"
      breadcrumbs={[{ label: "Student Portal" }, { label: "Achievements" }]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900">Achievements Wall</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track your milestones, streaks, and badges earned on QEMS</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="dash-card p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-between border-0 shadow-md">
            <div>
              <p className="text-xs text-amber-100 font-semibold uppercase tracking-wider">Total Badges</p>
              <p className="font-display text-3xl font-bold mt-1">
                {earnedCount} / {badges.length || 0}
              </p>
            </div>
            <Trophy className="h-10 w-10 text-amber-100 opacity-80" />
          </div>

          <div className="dash-card p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-between border-0 shadow-md">
            <div>
              <p className="text-xs text-orange-100 font-semibold uppercase tracking-wider">Active Streak</p>
              <p className="font-display text-3xl font-bold mt-1">{streak} Days</p>
            </div>
            <Flame className="h-10 w-10 text-orange-100 opacity-80 animate-pulse" />
          </div>

          <div className="dash-card p-6 bg-gradient-to-br from-primary-600 to-emerald-700 text-white flex items-center justify-between border-0 shadow-md">
            <div>
              <p className="text-xs text-green-100 font-semibold uppercase tracking-wider">Quality Score</p>
              <p className="font-display text-3xl font-bold mt-1">
                {qualityScore != null ? `${qualityScore.toFixed(1)} / 10` : "—"}
              </p>
            </div>
            <Award className="h-10 w-10 text-green-100 opacity-80" />
          </div>
        </div>

        {badges.length === 0 ? (
          <div className="dash-card p-12 text-center text-gray-400">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No badges configured for your institute yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {badges.map((b, idx) => (
              <div
                key={idx}
                className={cn(
                  "dash-card p-6 flex flex-col items-center text-center justify-between border border-border bg-white transition-all",
                  !b.earned && "opacity-60 bg-gray-50/50"
                )}
              >
                <div className="flex flex-col items-center">
                  <span className={cn(
                    "h-16 w-16 rounded-2xl flex items-center justify-center text-3xl mb-4 bg-gradient-to-br",
                    b.earned ? b.color + " shadow-md" : "from-gray-200 to-gray-300 text-gray-400"
                  )}>
                    {b.earned ? b.icon : "🔒"}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{b.name}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-[180px]">{b.desc}</p>
                </div>
                {b.earned && b.date && (
                  <p className="text-[10px] text-primary-700 font-semibold mt-4">Earned {b.date}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
