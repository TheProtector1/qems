"use client";

import { useState } from "react";
import {
  Users, CalendarCheck, BookOpen, Star, Clock, CheckCircle2,
  AlertCircle, ChevronRight, Plus, Sparkles, BookOpenCheck,
  Search, SlidersHorizontal, Trash2
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from "recharts";

// ── Mock Data for Teacher Dashboard ───────────────────────────
const INITIAL_STUDENTS = [
  { id: "1", name: "Ahmad Raza Khan", program: "Hifz", class: "Hifz A", currentJuz: 13, lastType: "SABAQ", lastSurah: "Al-Anbiya", lastAyahs: "21:68–82", status: "On Track", rating: 5 },
  { id: "2", name: "Fatima Noor", program: "Hifz", class: "Hifz A", currentJuz: 8, lastType: "SABQI", lastSurah: "Ta-Ha", lastAyahs: "20:40–60", status: "On Track", rating: 4 },
  { id: "3", name: "Usman Ali", program: "Nazra", class: "Nazra B", currentJuz: 2, lastType: "SABAQ", lastSurah: "Al-Baqarah", lastAyahs: "2:284-286", status: "Needs Attention", rating: 3 },
  { id: "4", name: "Zainab Hassan", program: "Hifz", class: "Hifz A", currentJuz: 22, lastType: "MANZIL", lastSurah: "Al-Kahf", lastAyahs: "18:1–30", status: "Excellent", rating: 5 },
  { id: "5", name: "Ibrahim Sheikh", program: "Tajweed", class: "Tajweed Intermediate", currentJuz: null, lastType: "RULE", lastSurah: "Al-Muzzammil", lastAyahs: "73:1-10", status: "On Track", rating: 4 },
  { id: "6", name: "Omar Farooq", program: "Hifz", class: "Hifz A", currentJuz: 15, lastType: "SABAQ", lastSurah: "Al-Isra", lastAyahs: "17:1-12", status: "On Track", rating: 4 },
  { id: "7", name: "Aisha Siddiqa", program: "Hifz", class: "Hifz A", currentJuz: 5, lastType: "SABQI", lastSurah: "An-Nisa", lastAyahs: "4:100-115", status: "Needs Attention", rating: 2 },
];

const CLASSES = [
  { id: "c1", name: "Hifz A", program: "Hifz", studentsCount: 12, time: "08:00 AM - 12:00 PM" },
  { id: "c2", name: "Nazra B", program: "Nazra", studentsCount: 8, time: "02:00 PM - 04:00 PM" },
  { id: "c3", name: "Tajweed Intermediate", program: "Tajweed", studentsCount: 6, time: "04:30 PM - 06:00 PM" },
];

const WEEKLY_PERFORMANCE = [
  { day: "Mon", avgRating: 4.2, attendance: 95 },
  { day: "Tue", avgRating: 4.5, attendance: 98 },
  { day: "Wed", avgRating: 4.1, attendance: 92 },
  { day: "Thu", avgRating: 4.6, attendance: 100 },
  { day: "Fri", avgRating: 4.4, attendance: 96 },
  { day: "Sat", avgRating: 4.3, attendance: 95 },
];

const SABAQ_STATS = [
  { category: "Sabaq", completed: 18, pending: 4 },
  { category: "Sabqi", completed: 16, pending: 6 },
  { category: "Manzil", completed: 19, pending: 3 },
];

export function TeacherDashboardContent() {
  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [activeTab, setActiveTab] = useState<"overview" | "class-list" | "log-lesson">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");

  // Log Form State
  const [logForm, setLogForm] = useState({
    studentId: "",
    type: "SABAQ",
    surahName: "",
    ayahs: "",
    lines: 10,
    rating: 5,
    mistakes: 0,
    remarks: "",
  });

  const [notifications, setNotifications] = useState([
    { id: 1, type: "absent", text: "Aisha Siddiqa has been absent for 2 consecutive days.", time: "1 hour ago" },
    { id: 2, type: "progress", text: "Zainab Hassan completed Juz 22 with excellent score (5★).", time: "2 hours ago" },
    { id: 3, type: "warning", text: "Usman Ali needs extra attention in Tajweed rules.", time: "Yesterday" },
  ]);

  const [lessonsLog, setLessonsLog] = useState([
    { id: "l1", name: "Ahmad Raza Khan", type: "SABAQ", surah: "Al-Anbiya", ayahs: "21:68-82", rating: 5, mistakes: 0, time: "Today 09:15 AM" },
    { id: "l2", name: "Fatima Noor", type: "SABQI", surah: "Ta-Ha", ayahs: "20:40-60", rating: 4, mistakes: 2, time: "Today 09:30 AM" },
    { id: "l3", name: "Zainab Hassan", type: "MANZIL", surah: "Al-Kahf", ayahs: "18:1-30", rating: 5, mistakes: 1, time: "Today 10:05 AM" },
  ]);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.studentId || !logForm.surahName || !logForm.ayahs) return;

    const student = students.find((s) => s.id === logForm.studentId);
    if (!student) return;

    // Log the lesson
    const newLog = {
      id: `l-${Date.now()}`,
      name: student.name,
      type: logForm.type,
      surah: logForm.surahName,
      ayahs: logForm.ayahs,
      rating: Number(logForm.rating),
      mistakes: Number(logForm.mistakes),
      time: "Just now",
    };

    setLessonsLog([newLog, ...lessonsLog]);

    // Update student's last recorded lesson state
    setStudents(
      students.map((s) =>
        s.id === student.id
          ? {
              ...s,
              lastType: logForm.type,
              lastSurah: logForm.surahName,
              lastAyahs: logForm.ayahs,
              rating: Number(logForm.rating),
            }
          : s
      )
    );

    // Reset Form
    setLogForm({
      studentId: "",
      type: "SABAQ",
      surahName: "",
      ayahs: "",
      lines: 10,
      rating: 5,
      mistakes: 0,
      remarks: "",
    });

    setActiveTab("overview");
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "All" || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900">
            السَّلَامُ عَلَيْكُمْ ، Qari Saheb 👋
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Here is your classroom overview for today
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab("log-lesson");
              setLogForm({ ...logForm, studentId: students[0]?.id || "" });
            }}
            className="btn-primary text-sm py-2"
          >
            <Plus className="h-4 w-4" />
            Log Quran Lesson
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Students", value: "26", sub: "3 Classes", icon: Users, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
          { label: "Attendance Today", value: "96.1%", sub: "25 Present / 1 Absent", icon: CalendarCheck, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600" },
          { label: "Lessons Logged Today", value: "18 / 26", sub: "8 pending", icon: BookOpenCheck, color: "from-violet-500 to-violet-600", bg: "bg-violet-50", text: "text-violet-600" },
          { label: "Avg Quality Score", value: "8.8 / 10", sub: "9.2 target", icon: Star, color: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-600" },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="kpi-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("h-5 w-5", kpi.text)} />
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: "overview", label: "📊 Classroom Hub" },
          { key: "class-list", label: "👥 Student Roster" },
          { key: "log-lesson", label: "✍️ Daily Lesson Logger" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === t.key ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "overview" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Daily Schedule / Active Classes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">My Schedule & Active Classes</h3>
              <div className="space-y-3">
                {CLASSES.map((c) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 gap-3">
                    <div>
                      <p className="font-bold text-gray-900 text-base">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.time} • {c.program} Program</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="pill pill-primary">{c.studentsCount} Students</span>
                      <button
                        onClick={() => {
                          setSelectedClass(c.name);
                          setActiveTab("class-list");
                        }}
                        className="btn-ghost text-xs py-1.5 px-3"
                      >
                        Manage Class
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Analytics Charts */}
            <div className="dash-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900">Class Performance Trend</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Average lesson quality & attendance</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={WEEKLY_PERFORMANCE}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }} />
                  <Area type="monotone" dataKey="avgRating" stroke="#D4AF37" fill="rgba(212,175,55,0.08)" strokeWidth={2.5} name="Avg Quality Score" />
                  <Area type="monotone" dataKey="attendance" stroke="#1B5E20" fill="rgba(27,94,32,0.05)" strokeWidth={2} name="Attendance %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Lessons Logged today */}
            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Today's Activity Feed</h3>
              <div className="space-y-3">
                {lessonsLog.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{log.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "pill text-[10px] py-0.5 px-2",
                          log.type === "SABAQ" && "pill-success",
                          log.type === "SABQI" && "pill-info",
                          log.type === "MANZIL" && "pill-primary"
                        )}>
                          {log.type}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">{log.surah} ({log.ayahs})</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex justify-end gap-0.5 mb-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={cn("h-3.5 w-3.5", idx < log.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400">{log.time} • {log.mistakes} mistakes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Classroom Alerts & Lesson Summary */}
          <div className="space-y-6">
            {/* Urgent Alerts / Notifications */}
            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🔔 Action Required</h3>
              <div className="space-y-3.5">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-900">{n.text}</p>
                      <p className="text-[10px] text-amber-600/70 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Lesson Progress Chart */}
            <div className="dash-card p-6">
              <h3 className="font-semibold text-gray-900 mb-1">Daily Log Targets</h3>
              <p className="text-xs text-gray-400 mb-4">Completed logs vs pending</p>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={SABAQ_STATS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: "#4B5563" }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="completed" stackId="a" fill="#1B5E20" name="Completed" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="pending" stackId="a" fill="#E5E7EB" name="Pending" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Tips for Quran Teachers */}
            <div className="dash-card p-5 bg-gradient-to-br from-primary-900 to-emerald-950 text-white border-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>
              <h4 className="font-semibold text-gold-light text-sm flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Teaching Best Practices
              </h4>
              <p className="text-xs text-green-100/90 leading-relaxed mt-2">
                "Consistently praise slow, accurate reading. Ensure students revise their Sabqi (recent revision) before writing new Sabaq to build strong neurological retention."
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "class-list" && (
        <div className="dash-card p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input pl-9 h-10 text-xs"
                />
              </div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="form-input w-40 h-10 text-xs py-1"
              >
                <option value="All">All Classes</option>
                <option value="Hifz A">Hifz A</option>
                <option value="Nazra B">Nazra B</option>
                <option value="Tajweed Intermediate">Tajweed Intermediate</option>
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Program</th>
                  <th>Juz/Para</th>
                  <th>Last Log</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="font-semibold text-gray-900">{s.name}</td>
                      <td>{s.class}</td>
                      <td>
                        <span className="pill pill-primary text-[10px] py-0.5">{s.program}</span>
                      </td>
                      <td>
                        <span className="font-bold text-gray-800">{s.currentJuz ? `Juz ${s.currentJuz}` : "—"}</span>
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-medium text-gray-700">{s.lastSurah}</span>
                          <span className="text-gray-400 ml-1">({s.lastAyahs})</span>
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          "pill text-[10px] py-0.5",
                          s.status === "Excellent" && "pill-success",
                          s.status === "On Track" && "pill-info",
                          s.status === "Needs Attention" && "pill-warning"
                        )}>
                          {s.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => {
                            setLogForm({
                              ...logForm,
                              studentId: s.id,
                              surahName: s.lastSurah || "",
                            });
                            setActiveTab("log-lesson");
                          }}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          Log Lesson
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400">
                      No students found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "log-lesson" && (
        <div className="max-w-2xl mx-auto dash-card p-8">
          <div className="mb-6">
            <h3 className="font-display text-xl font-bold text-gray-900">Daily Quran Lesson Recorder</h3>
            <p className="text-xs text-gray-500 mt-1">Record the recitation parameters, quality ratings, and comments for lesson logs.</p>
          </div>

          <form onSubmit={handleLogSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Student</label>
              <select
                value={logForm.studentId}
                onChange={(e) => setLogForm({ ...logForm, studentId: e.target.value })}
                className="form-input"
                required
              >
                <option value="">-- Choose Student --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lesson Category</label>
                <select
                  value={logForm.type}
                  onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                  className="form-input"
                >
                  <option value="SABAQ">Sabaq (New Lesson)</option>
                  <option value="SABQI">Sabqi (Recent Revision)</option>
                  <option value="MANZIL">Manzil (Long Revision)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Surah Name</label>
                <input
                  type="text"
                  placeholder="e.g. Al-Baqarah"
                  value={logForm.surahName}
                  onChange={(e) => setLogForm({ ...logForm, surahName: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ayah Range</label>
                <input
                  type="text"
                  placeholder="e.g. 1:1–7 or 20:40-60"
                  value={logForm.ayahs}
                  onChange={(e) => setLogForm({ ...logForm, ayahs: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Recited Lines Count</label>
                <input
                  type="number"
                  value={logForm.lines}
                  onChange={(e) => setLogForm({ ...logForm, lines: Number(e.target.value) })}
                  className="form-input"
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mistakes / Hesitations</label>
                <input
                  type="number"
                  value={logForm.mistakes}
                  onChange={(e) => setLogForm({ ...logForm, mistakes: Number(e.target.value) })}
                  className="form-input"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quality Rating</label>
                <select
                  value={logForm.rating}
                  onChange={(e) => setLogForm({ ...logForm, rating: Number(e.target.value) })}
                  className="form-input"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Perfect - 5/5)</option>
                  <option value={4}>⭐⭐⭐⭐ (Very Good - 4/5)</option>
                  <option value={3}>⭐⭐⭐ (Fair - 3/5)</option>
                  <option value={2}>⭐⭐ (Needs Work - 2/5)</option>
                  <option value={1}>⭐ (Poor - 1/5)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teacher Feedback Remarks</label>
              <textarea
                placeholder="Write specific observations (e.g. pay attention to nasalization rules, excellent recitation pace...)"
                value={logForm.remarks}
                onChange={(e) => setLogForm({ ...logForm, remarks: e.target.value })}
                className="form-input h-20 py-2.5 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
              >
                Submit Lesson Log
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
