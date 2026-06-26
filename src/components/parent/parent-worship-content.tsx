"use client";

import { useState, useEffect } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset, 
  Sparkles, 
  Check, 
  PlusCircle, 
  MinusCircle, 
  RotateCcw, 
  CloudSun,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudentOption = {
  id: string;
  fullName: string;
};

type ParentWorshipContentProps = {
  students: StudentOption[];
};

type WorshipRecord = {
  id?: string;
  date: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  duroodCount: number;
};

export function ParentWorshipContent({ students }: ParentWorshipContentProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [record, setRecord] = useState<WorshipRecord>({
    date: format(new Date(), "yyyy-MM-dd"),
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
    duroodCount: 0
  });
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState(true);

  // Generate last 7 days for the date selector strip
  const dateStrip = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();

  const fetchRecord = async (studentId: string, date: Date) => {
    if (!studentId) return;
    try {
      setLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");
      const res = await fetch(`/api/worship-tracker?studentId=${studentId}&date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setRecord(data[0]);
        } else {
          setRecord({
            date: dateStr,
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
            duroodCount: 0
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord(selectedStudentId, selectedDate);
  }, [selectedStudentId, selectedDate]);

  const saveRecord = async (updatedRecord: WorshipRecord) => {
    if (!selectedStudentId) return;
    try {
      setSaveStatus("saving");
      const res = await fetch("/api/worship-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          date: updatedRecord.date,
          fajr: updatedRecord.fajr,
          dhuhr: updatedRecord.dhuhr,
          asr: updatedRecord.asr,
          maghrib: updatedRecord.maghrib,
          isha: updatedRecord.isha,
          duroodCount: updatedRecord.duroodCount
        }),
      });

      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
    }
  };

  const handlePrayerToggle = (prayer: "fajr" | "dhuhr" | "asr" | "maghrib" | "isha") => {
    const updated = {
      ...record,
      [prayer]: !record[prayer]
    };
    setRecord(updated);
    saveRecord(updated);
  };

  const handleDuroodChange = (amount: number) => {
    const newCount = Math.max(0, record.duroodCount + amount);
    const updated = {
      ...record,
      duroodCount: newCount
    };
    setRecord(updated);
    saveRecord(updated);
  };

  const handleDuroodReset = () => {
    if (confirm("Reset Durood count to 0?")) {
      const updated = { ...record, duroodCount: 0 };
      setRecord(updated);
      saveRecord(updated);
    }
  };

  const prayers = [
    { key: "fajr", name: "Fajr", icon: Sunrise, time: "Dawn", color: "from-orange-400 to-amber-300" },
    { key: "dhuhr", name: "Dhuhr", icon: Sun, time: "Noon", color: "from-amber-400 to-yellow-300" },
    { key: "asr", name: "Asr", icon: CloudSun, time: "Afternoon", color: "from-yellow-500 to-orange-400" },
    { key: "maghrib", name: "Maghrib", icon: Sunset, time: "Dusk", color: "from-rose-500 to-orange-500" },
    { key: "isha", name: "Isha", icon: Moon, time: "Night", color: "from-indigo-600 to-slate-800" },
  ] as const;

  if (students.length === 0) {
    return (
      <div className="dash-card p-12 text-center max-w-lg mx-auto">
        <span className="text-5xl block mb-4">👥</span>
        <h3 className="font-bold text-gray-900 text-lg mb-1">No Child Profiles Link</h3>
        <p className="text-sm text-gray-500">
          There are no student profiles linked to your parent account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Selector drop-down & Date selector strip */}
      <div className="dash-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-gray-500 uppercase">Child Profile:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="form-input w-full sm:w-64 max-w-md h-9 py-1 text-xs"
            >
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="text-xs font-semibold">
            {saveStatus === "saving" && <span className="text-amber-500 animate-pulse">Saving changes...</span>}
            {saveStatus === "saved" && <span className="text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Auto-saved</span>}
            {saveStatus === "error" && <span className="text-red-500">Error saving changes</span>}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Date</h3>
          <div className="flex gap-2 justify-between overflow-x-auto pb-1">
            {dateStrip.map((date, idx) => {
              const isSelected = isSameDay(date, selectedDate);
              const isToday = isSameDay(date, new Date());
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex-1 min-w-[70px] py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all border",
                    isSelected 
                      ? "bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/10 scale-105" 
                      : "bg-white text-gray-700 border-gray-150 hover:bg-gray-50"
                  )}
                >
                  <span className="text-[10px] uppercase font-semibold opacity-70">
                    {format(date, "eee")}
                  </span>
                  <span className="text-sm font-bold mt-0.5">
                    {format(date, "d")}
                  </span>
                  {isToday && (
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full mt-1",
                      isSelected ? "bg-white" : "bg-primary-500"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Prayers Tracker Card */}
        <div className="md:col-span-3 dash-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Daily Prayers</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record daily Salaah for {format(selectedDate, "MMMM dd")}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading records...</div>
            ) : (
              <div className="space-y-4">
                {prayers.map((prayer) => {
                  const Icon = prayer.icon;
                  const isOffered = record[prayer.key];

                  return (
                    <button
                      key={prayer.key}
                      onClick={() => handlePrayerToggle(prayer.key)}
                      className={cn(
                        "w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all hover:translate-x-1",
                        isOffered
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-950 hover:bg-emerald-50"
                          : "bg-white border-gray-100 text-gray-900 hover:border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "p-2.5 rounded-xl bg-gradient-to-br text-white shadow-sm",
                          isOffered ? "from-emerald-500 to-teal-600" : prayer.color
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm leading-snug">{prayer.name}</h4>
                          <span className="text-[10px] text-gray-400 font-medium">{prayer.time}</span>
                        </div>
                      </div>

                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                        isOffered
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25"
                          : "border-gray-200"
                      )}>
                        {isOffered && <Check className="h-4 w-4 stroke-[3px]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">
              Completed {Object.values(record).filter(v => v === true).length} of 5 prayers today.
            </span>
          </div>
        </div>

        {/* Durood Counter Card */}
        <div className="md:col-span-2 dash-card p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white border-none">
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-indigo-900/50">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Durood count
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">Recited Durood count</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-indigo-300">Loading count...</div>
            ) : (
              <div className="text-center py-6">
                <span className="text-5xl font-black tracking-tight text-indigo-300 block mb-2 transition-all">
                  {record.duroodCount.toLocaleString()}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Total Durood today</span>
              </div>
            )}

            {/* Quick add triggers */}
            <div className="grid grid-cols-3 gap-2">
              {[10, 33, 100].map((num) => (
                <button
                  key={num}
                  disabled={loading}
                  onClick={() => handleDuroodChange(num)}
                  className="py-2.5 rounded-xl bg-indigo-900/30 border border-indigo-800/40 text-xs font-semibold hover:bg-indigo-900/60 hover:border-indigo-700 active:scale-95 transition-all"
                >
                  +{num}
                </button>
              ))}
            </div>

            {/* Main tap to increase button */}
            <div className="flex justify-center pt-2">
              <button
                disabled={loading}
                onClick={() => handleDuroodChange(1)}
                className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-95 flex flex-col items-center justify-center shadow-lg shadow-indigo-500/25 border-4 border-indigo-900/30 transition-all cursor-pointer"
              >
                <PlusCircle className="h-8 w-8 mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider">Tap to count</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-900/50 flex justify-between items-center text-xs text-indigo-300">
            <button
              disabled={loading || record.duroodCount === 0}
              onClick={() => handleDuroodChange(-1)}
              className="flex items-center gap-1 hover:text-white disabled:opacity-50 transition-colors"
            >
              <MinusCircle className="h-3.5 w-3.5" /> Remove 1
            </button>
            <button
              disabled={loading || record.duroodCount === 0}
              onClick={handleDuroodReset}
              className="flex items-center gap-1 hover:text-white disabled:opacity-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
