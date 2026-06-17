import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Award, Flame, Star, StarOff, Trophy, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Achievements - Student Portal" };

const BADGES = [
  { icon: "🏆", name: "First Juz Complete", desc: "Memorized your first entire Juz", date: "Feb 14, 2025", earned: true, color: "from-yellow-400 to-amber-600" },
  { icon: "⭐", name: "Top Student of March", desc: "Scored highest average rating in March", date: "Mar 31, 2025", earned: true, color: "from-blue-400 to-indigo-600" },
  { icon: "📚", name: "50-Day Attendance Streak", desc: "Attended classes 50 days without break", date: "Apr 28, 2025", earned: true, color: "from-green-400 to-emerald-600" },
  { icon: "🎯", name: "Tajweed Master", desc: "Passed Tajweed rules assessments with 95%+", date: null, earned: false, color: "from-purple-400 to-violet-600" },
  { icon: "🌟", name: "Five Juz Complete", desc: "Memorized 5 complete Juz", date: null, earned: false, color: "from-teal-400 to-cyan-600" },
  { icon: "🔥", name: "100-Day Attendance Streak", desc: "Attended classes 100 days without break", date: null, earned: false, color: "from-rose-400 to-pink-600" },
];

export default async function StudentAchievementsPage() {
  const session = await getAuthSession();
  if (!session) redirect("/auth/login");

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

        {/* ── Summary Stats ── */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="dash-card p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-between border-0 shadow-md">
            <div>
              <p className="text-xs text-amber-100 font-semibold uppercase tracking-wider">Total Badges</p>
              <p className="font-display text-3xl font-bold mt-1">3 / 6</p>
            </div>
            <Trophy className="h-10 w-10 text-amber-100 opacity-80" />
          </div>

          <div className="dash-card p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-between border-0 shadow-md">
            <div>
              <p className="text-xs text-orange-100 font-semibold uppercase tracking-wider">Active Streak</p>
              <p className="font-display text-3xl font-bold mt-1">47 Days</p>
            </div>
            <Flame className="h-10 w-10 text-orange-100 opacity-80 animate-pulse" />
          </div>

          <div className="dash-card p-6 bg-gradient-to-br from-primary-600 to-emerald-700 text-white flex items-center justify-between border-0 shadow-md">
            <div>
              <p className="text-xs text-green-100 font-semibold uppercase tracking-wider">Quality Score</p>
              <p className="font-display text-3xl font-bold mt-1">9.2 / 10</p>
            </div>
            <Award className="h-10 w-10 text-green-100 opacity-80" />
          </div>
        </div>

        {/* ── Badges Grid ── */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {BADGES.map((b, idx) => (
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

              <div className="mt-4 pt-4 border-t border-gray-100 w-full text-xs text-gray-400">
                {b.earned ? (
                  <span className="text-emerald-600 font-medium">Unlocked on {b.date}</span>
                ) : (
                  <span className="text-gray-400">Locked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
