import { HifzDirection } from "@prisma/client";

export const HIFZ_DIRECTION_OPTIONS = [
  {
    value: "REVERSE" as const,
    label: "Para 30 → 1 (Amma first)",
    shortLabel: "30 → 1",
    desc: "Start with Juz Amma (short surahs) and memorise backwards — the most common method in Pakistani madrasas.",
  },
  {
    value: "FORWARD" as const,
    label: "Para 1 → 30 (Baqarah first)",
    shortLabel: "1 → 30",
    desc: "Start from Juz 1 (Surah Al-Baqarah) and progress forward to the end of the Quran.",
  },
];

export function parseHifzDirection(value?: string | null): HifzDirection {
  return value === "FORWARD" ? HifzDirection.FORWARD : HifzDirection.REVERSE;
}

export function getDefaultStartingJuz(direction: HifzDirection): number {
  return direction === HifzDirection.REVERSE ? 30 : 1;
}

export function clampJuz(n: number | null | undefined): number | null {
  if (n === null || n === undefined || !Number.isFinite(n)) return null;
  return Math.min(30, Math.max(1, Math.round(n)));
}

export type JuzCellState = "completed" | "current" | "upcoming";

export function getJuzCellState(
  direction: HifzDirection,
  currentJuz: number | null | undefined,
  juz: number
): JuzCellState {
  const current = clampJuz(currentJuz);
  if (!current) return "upcoming";

  if (direction === HifzDirection.FORWARD) {
    if (juz < current) return "completed";
    if (juz === current) return "current";
    return "upcoming";
  }

  if (juz > current) return "completed";
  if (juz === current) return "current";
  return "upcoming";
}

export function getCompletedJuzCount(
  direction: HifzDirection,
  currentJuz: number | null | undefined
): number {
  const current = clampJuz(currentJuz);
  if (!current) return 0;
  if (direction === HifzDirection.FORWARD) return Math.max(0, current - 1);
  return Math.max(0, 30 - current);
}

export function getHifzCompletionPercent(
  direction: HifzDirection,
  currentJuz: number | null | undefined
): number {
  return Math.round((getCompletedJuzCount(direction, currentJuz) / 30) * 100);
}

export function buildJuzGrid(direction: HifzDirection, currentJuz: number | null | undefined) {
  return Array.from({ length: 30 }, (_, i) => {
    const juz = i + 1;
    const state = getJuzCellState(direction, currentJuz, juz);
    return {
      juz,
      state,
      completed: state === "completed",
      partial: state === "current",
    };
  });
}

export function hifzDirectionLabel(direction: HifzDirection | null | undefined): string {
  if (direction === HifzDirection.FORWARD) return "Para 1 → 30 (Baqarah first)";
  if (direction === HifzDirection.REVERSE) return "Para 30 → 1 (Amma first)";
  return "—";
}

export function currentParaLabel(
  direction: HifzDirection,
  currentJuz: number | null | undefined
): string {
  const juz = clampJuz(currentJuz);
  if (!juz) return "Not set";
  if (direction === HifzDirection.REVERSE) {
    return juz === 1 ? "Para 1 — final juz in progress" : `Para ${juz} — ${30 - juz} para(s) completed from Amma`;
  }
  return juz === 30 ? "Para 30 — final juz in progress" : `Para ${juz} — ${juz - 1} para(s) completed`;
}
