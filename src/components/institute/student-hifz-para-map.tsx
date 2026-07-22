"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HifzDirection } from "@prisma/client";
import { HifzJuzGrid, ParaCompletionHistory } from "@/components/common/hifz-juz-grid";
import { ParaCompletionModal } from "@/components/institute/para-completion-modal";
import {
  getDefaultStartingJuz,
  getNextPara,
  type JuzCellState,
  type ParaCompletionInfo,
} from "@/lib/hifz-progress";

export function StudentHifzParaMap({
  studentId,
  direction,
  currentPara: initialCurrent,
  hifzCompleted: initialCompleted,
  completions: initialCompletions,
  canEdit = true,
}: {
  studentId: string;
  direction: HifzDirection;
  currentPara: number | null;
  hifzCompleted: boolean;
  completions: ParaCompletionInfo[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [currentPara, setCurrentPara] = useState(initialCurrent);
  const [hifzCompleted, setHifzCompleted] = useState(initialCompleted);
  const [completions, setCompletions] = useState(initialCompletions);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    mode: "complete" | "view";
    para: number;
    completion: ParaCompletionInfo | null;
  }>({ open: false, mode: "complete", para: 1, completion: null });

  const paraDetails = Object.fromEntries(
    completions.map((c) => [c.paraNumber, c])
  ) as Record<number, ParaCompletionInfo>;
  const completedParas = completions.map((c) => c.paraNumber);
  const effectiveCurrent =
    currentPara ?? (hifzCompleted ? null : getDefaultStartingJuz(direction));

  const handleParaClick = useCallback(
    (para: number, state: JuzCellState, completion: ParaCompletionInfo | null) => {
      if (!canEdit) {
        if (state === "completed" && completion) {
          setModal({ open: true, mode: "view", para, completion });
        }
        return;
      }
      if (state === "current" && !hifzCompleted) {
        setModal({ open: true, mode: "complete", para, completion: null });
      } else if (state === "completed" && completion) {
        setModal({ open: true, mode: "view", para, completion });
      }
    },
    [canEdit, hifzCompleted]
  );

  const handleSubmit = async (data: {
    daysToComplete: number;
    notes: string;
    completedAt: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/institute/hifz/para-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          paraNumber: modal.para,
          daysToComplete: data.daysToComplete,
          notes: data.notes || undefined,
          completedAt: data.completedAt,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to mark para complete");

      const next = getNextPara(direction, modal.para);
      const done = Boolean(body.student?.hifzCompleted) || next === null;

      setCompletions((prev) => [
        ...prev.filter((c) => c.paraNumber !== modal.para),
        {
          paraNumber: modal.para,
          completedAt: data.completedAt,
          daysToComplete: data.daysToComplete,
          notes: data.notes || null,
          markedByName: body.completion?.markedByName ?? null,
        },
      ]);
      setCurrentPara(done ? modal.para : body.student?.currentPara ?? next);
      setHifzCompleted(done);
      setModal((m) => ({ ...m, open: false }));
      toast.success(body.message || `Para ${modal.para} marked complete`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <HifzJuzGrid
        direction={direction}
        currentJuz={effectiveCurrent}
        interactive={canEdit || completions.length > 0}
        hifzCompleted={hifzCompleted}
        completedParas={completedParas}
        paraDetails={paraDetails}
        onParaClick={handleParaClick}
      />
      {canEdit && !hifzCompleted && (
        <p className="text-xs text-primary-700 mt-3">
          Click the highlighted current para to mark it complete and record how many days it took.
        </p>
      )}
      <ParaCompletionHistory completions={completions} />
      <ParaCompletionModal
        key={`${modal.mode}-${modal.para}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        para={modal.para}
        direction={direction}
        completion={modal.completion}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSubmit={handleSubmit}
        submitting={saving}
      />
    </div>
  );
}
