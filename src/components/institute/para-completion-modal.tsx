"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { ParaCompletionInfo } from "@/lib/hifz-progress";
import { getNextPara } from "@/lib/hifz-progress";
import { HifzDirection } from "@prisma/client";

type ModalMode = "complete" | "view";

export function ParaCompletionModal({
  open,
  mode,
  para,
  direction,
  completion,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  mode: ModalMode;
  para: number;
  direction: HifzDirection;
  completion: ParaCompletionInfo | null;
  onClose: () => void;
  onSubmit: (data: { daysToComplete: number; notes: string; completedAt: string }) => void;
  submitting?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [daysToComplete, setDaysToComplete] = useState("7");
  const [notes, setNotes] = useState("");
  const [completedAt, setCompletedAt] = useState(today);

  if (!open) return null;

  const nextPara = mode === "complete" ? getNextPara(direction, para) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg">
              {mode === "complete" ? `Mark Para ${para} Complete` : `Para ${para} — Completed`}
            </h3>
            {mode === "complete" && nextPara !== null && (
              <p className="text-primary-200 text-xs mt-0.5">
                Student will advance to Para {nextPara}
              </p>
            )}
            {mode === "complete" && nextPara === null && (
              <p className="text-primary-200 text-xs mt-0.5">Final para — full Hifz will be marked complete</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "view" && completion ? (
          <div className="p-5 space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duration</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {completion.daysToComplete} day{completion.daysToComplete !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Completed</p>
                <p className="font-bold text-gray-900 mt-0.5">{formatDate(completion.completedAt)}</p>
              </div>
            </div>
            {completion.markedByName && (
              <p className="text-xs text-gray-500">Marked by {completion.markedByName}</p>
            )}
            {completion.notes ? (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1">Teacher Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  {completion.notes}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No notes recorded</p>
            )}
            <button type="button" onClick={onClose} className="btn-primary w-full justify-center text-sm py-2">
              Close
            </button>
          </div>
        ) : (
          <form
            className="p-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit({
                daysToComplete: parseInt(daysToComplete, 10),
                notes: notes.trim(),
                completedAt,
              });
            }}
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Days to complete this para <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={365}
                required
                value={daysToComplete}
                onChange={(e) => setDaysToComplete(e.target.value)}
                className="form-input"
                placeholder="e.g. 14"
              />
              <p className="text-[10px] text-gray-400 mt-1">How many days the student took to memorise this para</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Completion date</label>
              <input
                type="date"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="form-input resize-none"
                placeholder="Quality, revision notes, special circumstances..."
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1 text-sm py-2" disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center text-sm py-2" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Mark Complete</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
