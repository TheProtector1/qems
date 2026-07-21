"use client";

import { useState } from "react";
import { ParentLeavePanel } from "@/components/parent/parent-leave-panel";
import { ParentAttendanceContent } from "@/components/parent/parent-attendance-content";
import { cn } from "@/lib/utils";
import { CalendarCheck, CalendarPlus } from "lucide-react";

export function ParentAttendanceTabs() {
  const [tab, setTab] = useState<"calendar" | "leave">("calendar");

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab("calendar")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
            tab === "calendar" ? "bg-white shadow-sm text-primary-800" : "text-gray-500"
          )}
        >
          <CalendarCheck className="h-4 w-4" /> Attendance
        </button>
        <button
          type="button"
          onClick={() => setTab("leave")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
            tab === "leave" ? "bg-white shadow-sm text-primary-800" : "text-gray-500"
          )}
        >
          <CalendarPlus className="h-4 w-4" /> Request leave
        </button>
      </div>
      {tab === "calendar" ? <ParentAttendanceContent /> : <ParentLeavePanel />}
    </div>
  );
}
