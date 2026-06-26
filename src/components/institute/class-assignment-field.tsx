"use client";

import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export type InstituteClassOption = {
  id: string;
  name: string;
  programType: string;
  teacherId?: string | null;
  teacher?: { id?: string; user?: { name?: string } } | null;
};

function programToType(program: string): string {
  return program.toUpperCase();
}

export function ClassAssignmentField({
  classes,
  program,
  selectedIds,
  onChange,
  compact = false,
}: {
  classes: InstituteClassOption[];
  program: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}) {
  const programType = programToType(program);
  const filtered = classes.filter((c) => c.programType === programType);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  if (filtered.length === 0) {
    return (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
        No {program} classes yet. Create them under <strong>Students → Classes</strong>, or save without a class for now.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "space-y-1.5 overflow-y-auto rounded-xl border border-gray-200 p-2",
        compact ? "max-h-36" : "max-h-44"
      )}
    >
      {filtered.map((c) => {
        const checked = selectedIds.includes(c.id);
        const teacherName = c.teacher?.user?.name;
        return (
          <label
            key={c.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
              checked ? "bg-primary-50 border border-primary-200" : "hover:bg-gray-50 border border-transparent"
            )}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(c.id)}
              className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-900 truncate">{c.name}</span>
              </div>
              {teacherName && (
                <p className="text-[10px] text-gray-500 mt-0.5 ml-5">Teacher: {teacherName}</p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export function classNamesFromIds(
  classes: InstituteClassOption[],
  classIds: string[]
): string {
  if (!classIds.length) return "Unassigned";
  const names = classIds
    .map((id) => classes.find((c) => c.id === id)?.name)
    .filter(Boolean);
  return names.length ? names.join(", ") : "Unassigned";
}
