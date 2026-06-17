import { ProgramType, ProgressStartType } from "@prisma/client";

export type ProgressInput = {
  progressStartType?: string;
  previousInstitute?: string;
  currentJuz?: string | number | null;
  currentPara?: string | number | null;
  currentSurah?: string | number | null;
  currentPage?: string | number | null;
};

export function resolveInitialProgress(
  programType: ProgramType,
  input: ProgressInput
): {
  progressStartType: ProgressStartType;
  previousInstitute: string | null;
  currentJuz: number | null;
  currentPara: number | null;
  currentSurah: number | null;
  currentPage: number | null;
} {
  const isContinuing = input.progressStartType === "CONTINUING";
  const progressStartType = isContinuing ? ProgressStartType.CONTINUING : ProgressStartType.NEW;

  const parseIntOrNull = (v: string | number | null | undefined) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
  };

  if (programType === ProgramType.HIFZ) {
    return {
      progressStartType,
      previousInstitute: isContinuing ? input.previousInstitute || null : null,
      currentJuz: isContinuing ? parseIntOrNull(input.currentJuz) ?? 1 : 1,
      currentPara: isContinuing ? parseIntOrNull(input.currentPara) : null,
      currentSurah: null,
      currentPage: null,
    };
  }

  if (programType === ProgramType.NAZRA) {
    return {
      progressStartType,
      previousInstitute: isContinuing ? input.previousInstitute || null : null,
      currentJuz: null,
      currentPara: null,
      currentSurah: isContinuing ? parseIntOrNull(input.currentSurah) ?? 1 : 1,
      currentPage: isContinuing ? parseIntOrNull(input.currentPage) ?? 1 : 1,
    };
  }

  return {
    progressStartType,
    previousInstitute: isContinuing ? input.previousInstitute || null : null,
    currentJuz: null,
    currentPara: null,
    currentSurah: null,
    currentPage: null,
  };
}

export function progressSummaryLabel(
  programType: ProgramType,
  student: {
    progressStartType?: ProgressStartType | null;
    previousInstitute?: string | null;
    currentJuz?: number | null;
    currentPara?: number | null;
    currentSurah?: number | null;
    currentPage?: number | null;
  }
): string {
  const start = student.progressStartType === ProgressStartType.CONTINUING ? "Continuing" : "Starting fresh";
  if (programType === ProgramType.HIFZ) {
    const juz = student.currentJuz ?? 1;
    const para = student.currentPara ? `, Para ${student.currentPara}` : "";
    const from = student.previousInstitute ? ` from ${student.previousInstitute}` : "";
    return `${start}${from} — Juz ${juz}${para}`;
  }
  if (programType === ProgramType.NAZRA) {
    const from = student.previousInstitute ? ` from ${student.previousInstitute}` : "";
    return `${start}${from} — Surah ${student.currentSurah ?? 1}, Page ${student.currentPage ?? 1}`;
  }
  return start;
}
