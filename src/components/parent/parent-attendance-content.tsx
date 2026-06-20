"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { StudentAttendanceCalendar } from "@/components/institute/student-attendance-calendar";

type ChildOption = { id: string; fullName: string; studentId: string };

export function ParentAttendanceContent() {
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parent/attendance");
      if (!res.ok) return;
      const data = await res.json();
      const list: ChildOption[] = data.children || [];
      setChildren(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="dash-card p-10 text-center">
        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">No linked students</p>
        <p className="text-sm text-gray-500 mt-1">Contact your institute if you expect to see a child here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Select child</label>
        <select
          className="form-input w-auto min-w-[220px]"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {children.map((c) => (
            <option key={c.id} value={c.id}>{c.fullName} ({c.studentId})</option>
          ))}
        </select>
      </div>

      {selectedId && (
        <StudentAttendanceCalendar studentId={selectedId} apiScope="parent" />
      )}
    </div>
  );
}
