export type HifzLessonType = "SABAQ" | "SABQI" | "MANZIL";
export type LessonDoneStatus = "done" | "not_done";

export const HIFZ_LESSON_LABELS: Record<HifzLessonType, string> = {
  SABAQ: "Sabaq",
  SABQI: "Sabqi",
  MANZIL: "Manzil",
};

/** A "simple" done/not-done lesson has no real ayah range recorded (ayahFrom/ayahTo === 0). */
export function isSimpleHifzLesson(r: { ayahFrom: number; ayahTo: number }): boolean {
  return r.ayahFrom === 0 && r.ayahTo === 0;
}

export function simpleLessonDoneStatus(teacherNote?: string | null): LessonDoneStatus {
  return teacherNote?.includes("not done") ? "not_done" : "done";
}

type HifzRecordLike = {
  date: string;
  type: HifzLessonType | string;
  ayahFrom: number;
  ayahTo: number;
  teacherNote?: string | null;
};

/**
 * Groups hifz records by date and lesson type into a done/not_done map.
 * A detailed (non-simple) lesson always counts as "done" — it was recorded with real content.
 * When multiple records exist for the same date+type, "done" wins over "not_done".
 */
export function buildHifzDayMap(
  records: HifzRecordLike[]
): Record<string, Partial<Record<HifzLessonType, LessonDoneStatus>>> {
  const map: Record<string, Partial<Record<HifzLessonType, LessonDoneStatus>>> = {};
  for (const r of records) {
    const type = r.type as HifzLessonType;
    if (type !== "SABAQ" && type !== "SABQI" && type !== "MANZIL") continue;
    const status: LessonDoneStatus = isSimpleHifzLesson(r) ? simpleLessonDoneStatus(r.teacherNote) : "done";
    const bucket = (map[r.date] ??= {});
    if (bucket[type] !== "done") bucket[type] = status;
  }
  return map;
}
