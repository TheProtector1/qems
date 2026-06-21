"use client";

import { useState, useEffect } from "react";
import { format, subDays, startOfDay, parseISO } from "date-fns";
import { Sparkles, Calendar, BookOpen, Check, HelpCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentOption = {
  id: string;
  fullName: string;
};

type TeacherWorshipContentProps = {
  students: StudentOption[];
};

type WorshipRecord = {
  id: string;
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  duroodCount: number;
};

export function TeacherWorshipContent({ students }: TeacherWorshipContentProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ""
  );
  const [records, setRecords] = useState<WorshipRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate date list for the last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), i));

  const fetchRecords = async (studentId: string) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const endDate = format(new Date(), "yyyy-MM-dd");
      const startDate = format(subDays(new Date(), 13), "yyyy-MM-dd");
      const res = await fetch(
        `/api/worship-tracker?studentId=${studentId}&startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(selectedStudentId);
  }, [selectedStudentId]);

  // Find record for a specific date
  const getRecordForDate = (date: Date) => {
    return records.find((r) => {
      const recDate = parseISO(r.date);
      return (
        recDate.getFullYear() === date.getFullYear() &&
        recDate.getMonth() === date.getMonth() &&
        recDate.getDate() === date.getDate()
      );
    });
  };

  // Calculate statistics
  const totalPrayersPossible = records.length * 5;
  let totalPrayersOffered = 0;
  let totalDurood = 0;

  records.forEach((r) => {
    if (r.fajr) totalPrayersOffered++;
    if (r.dhuhr) totalPrayersOffered++;
    if (r.asr) totalPrayersOffered++;
    if (r.maghrib) totalPrayersOffered++;
    if (r.isha) totalPrayersOffered++;
    totalDurood += r.duroodCount;
  });

  const prayerConsistencyPct = totalPrayersPossible > 0 
    ? Math.round((totalPrayersOffered / totalPrayersPossible) * 100)
    : 0;

  if (students.length === 0) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <span className="text-5xl block mb-4">👥</span>
        <h3 className="font-bold text-gray-900 text-lg mb-1">No Assigned Students</h3>
        <p className="text-sm text-gray-500">
          You don't have any students assigned to your classes at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Student Selector Card */}
      <div className="dash-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Select Student:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="form-input w-64 h-9 py-1 text-xs"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-400">
            Monitoring last 14 days of spiritual activity.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 font-medium">Loading spiritual records...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="dash-card p-5 border-l-4 border-l-primary-500">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prayer Consistency</h4>
              <p className="text-2xl font-black text-gray-900 mt-2">{prayerConsistencyPct}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalPrayersOffered} of {totalPrayersPossible} prayers offered
              </p>
            </div>
            
            <div className="dash-card p-5 border-l-4 border-l-indigo-500">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Durood (14 Days)</h4>
              <p className="text-2xl font-black text-gray-900 mt-2">{totalDurood.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Salutations sent to Prophet ﷺ</p>
            </div>

            <div className="dash-card p-5 border-l-4 border-l-emerald-500">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Logs</h4>
              <p className="text-2xl font-black text-gray-900 mt-2">{records.length} days</p>
              <p className="text-xs text-gray-500 mt-1">Logged out of last 14 days</p>
            </div>
          </div>

          {/* Spiritual Grid Table */}
          <div className="dash-card overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Spiritual Progress Grid</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase bg-gray-50/20">
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4 text-center">Fajr</th>
                    <th className="p-4 text-center">Dhuhr</th>
                    <th className="p-4 text-center">Asr</th>
                    <th className="p-4 text-center">Maghrib</th>
                    <th className="p-4 text-center">Isha</th>
                    <th className="p-4 text-right pr-6">Durood Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {last14Days.map((date, idx) => {
                    const record = getRecordForDate(date);
                    const isToday = idx === 0;

                    return (
                      <tr key={idx} className={cn("hover:bg-gray-50/50", isToday && "bg-primary-50/10")}>
                        <td className="p-4 pl-6 font-medium text-gray-700">
                          {format(date, "EEE, MMM dd")}
                          {isToday && (
                            <span className="ml-2 pill pill-primary text-[9px] py-0.5 px-1.5">
                              Today
                            </span>
                          )}
                        </td>
                        
                        {/* Fajr */}
                        <td className="p-4 text-center">
                          <PrayerDot active={record?.fajr} logged={!!record} />
                        </td>

                        {/* Dhuhr */}
                        <td className="p-4 text-center">
                          <PrayerDot active={record?.dhuhr} logged={!!record} />
                        </td>

                        {/* Asr */}
                        <td className="p-4 text-center">
                          <PrayerDot active={record?.asr} logged={!!record} />
                        </td>

                        {/* Maghrib */}
                        <td className="p-4 text-center">
                          <PrayerDot active={record?.maghrib} logged={!!record} />
                        </td>

                        {/* Isha */}
                        <td className="p-4 text-center">
                          <PrayerDot active={record?.isha} logged={!!record} />
                        </td>

                        {/* Durood */}
                        <td className="p-4 text-right pr-6 font-bold text-indigo-600">
                          {record ? record.duroodCount.toLocaleString() : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PrayerDot({ active, logged }: { active?: boolean; logged: boolean }) {
  if (!logged) {
    return <span className="inline-block h-3 w-3 rounded-full bg-gray-100 border border-gray-200" title="Not logged" />;
  }
  return (
    <span
      className={cn(
        "inline-block h-4.5 w-4.5 rounded-full flex items-center justify-center text-white",
        active 
          ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" 
          : "bg-red-50 border border-red-200"
      )}
      title={active ? "Offered" : "Missed"}
    >
      {active ? (
        <Check className="h-3 w-3 stroke-[3px]" />
      ) : (
        <span className="text-[10px] text-red-500 font-bold">×</span>
      )}
    </span>
  );
}
