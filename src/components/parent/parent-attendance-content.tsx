"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { StudentAttendanceCalendar } from "@/components/institute/student-attendance-calendar";

type ChildOption = {
  id: string;
  fullName: string;
  studentId: string;
  photo?: string | null;
  gender?: string;
  programType?: string;
};

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
      setSelectedId((prev) => prev || list[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading attendance…
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
    <StudentAttendanceCalendar
      studentId={selectedId}
      apiScope="parent"
      students={children}
      selectedStudentId={selectedId}
      onStudentChange={setSelectedId}
      student={children.find((c) => c.id === selectedId)}
      readOnly
    />
  );
}
