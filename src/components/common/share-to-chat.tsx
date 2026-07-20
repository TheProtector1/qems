"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Share2,
  X,
  Search,
  Loader2,
  Send,
  Check,
  Users,
  MessageSquare,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import {
  formatShareMessage,
  shareCategoryLabel,
  type ShareDraft,
} from "@/lib/share-templates";

export type ShareContact = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  suggested?: boolean;
};

function messagesApiForRole(role?: string | null) {
  if (role === "PARENT") return "/api/parent/messages";
  if (role === "TEACHER") return "/api/teacher/messages";
  return "/api/institute/messages";
}

function canShare(role?: string | null) {
  return (
    role === "INSTITUTE_OWNER" ||
    role === "BRANCH_MANAGER" ||
    role === "TEACHER" ||
    role === "SUPER_ADMIN"
  );
}

type ShareToChatModalProps = {
  open: boolean;
  onClose: () => void;
  draft: ShareDraft;
  /** Prefer sending to these contacts first (e.g. linked parent) */
  preferredRecipients?: ShareContact[];
  /** Resolve parent + stakeholders for a student */
  studentId?: string;
};

export function ShareToChatModal({
  open,
  onClose,
  draft,
  preferredRecipients = [],
  studentId,
}: ShareToChatModalProps) {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const messagesApi = messagesApiForRole(role);

  const initialMessage = useMemo(
    () =>
      formatShareMessage(draft, {
        senderName: session?.user?.name || undefined,
      }),
    [draft, session?.user?.name]
  );

  const [message, setMessage] = useState(initialMessage);
  const [contacts, setContacts] = useState<ShareContact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setMessage(initialMessage);
  }, [open, initialMessage]);

  const loadRecipients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ directory: "1" });
      if (studentId) params.set("forStudent", studentId);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`${messagesApi}?${params}`);
      if (!res.ok) throw new Error("Could not load contacts");
      const data = await res.json();

      const fromApi: ShareContact[] = (data.contacts || []).map(
        (c: { id: string; name: string; role: string; avatar?: string }) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          avatar: c.avatar || getInitials(c.name),
        })
      );

      const parent: ShareContact | null = data.parent
        ? {
            id: data.parent.id,
            name: data.parent.name,
            role: data.parent.role || "Parent",
            avatar: data.parent.avatar || getInitials(data.parent.name),
            suggested: true,
          }
        : null;

      const preferredMap = new Map<string, ShareContact>();
      for (const p of preferredRecipients) {
        preferredMap.set(p.id, { ...p, suggested: true, avatar: p.avatar || getInitials(p.name) });
      }
      if (parent) preferredMap.set(parent.id, parent);

      const merged = new Map<string, ShareContact>();
      preferredMap.forEach((c, id) => merged.set(id, c));
      for (const c of fromApi) {
        if (!merged.has(c.id)) merged.set(c.id, c);
        else merged.set(c.id, { ...c, suggested: merged.get(c.id)?.suggested });
      }

      const list = Array.from(merged.values()).sort((a, b) => {
        if (a.suggested !== b.suggested) return a.suggested ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setContacts(list);

      setSelected((prev) => {
        if (prev.size > 0) return prev;
        const next = new Set<string>();
        preferredMap.forEach((_, id) => next.add(id));
        if (next.size === 0 && list[0]) next.add(list[0].id);
        return next;
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not load recipients");
    } finally {
      setLoading(false);
    }
    // preferredRecipients intentionally omitted — snapshotted when modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesApi, studentId, search]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => loadRecipients(), search ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, search, loadRecipients]);

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
      setSearch("");
    }
  }, [open]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectSuggested = () => {
    setSelected(new Set(contacts.filter((c) => c.suggested).map((c) => c.id)));
  };

  const handleSend = async () => {
    if (!message.trim() || selected.size === 0 || sending) return;
    setSending(true);
    try {
      const receiverIds = Array.from(selected);
      const res = await fetch(messagesApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverIds,
          content: message.trim(),
          subject: draft.title,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send");

      const count = data.sent ?? receiverIds.length;
      toast.success(
        count === 1
          ? "Update shared in chat"
          : `Update shared with ${count} recipients`
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3 bg-gradient-to-br from-primary-800 to-primary-950 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-200">
              Share via chat
            </p>
            <h3 className="font-display font-bold text-lg truncate mt-0.5">{draft.title}</h3>
            <p className="text-xs text-primary-200 mt-0.5">
              {shareCategoryLabel(draft.category)}
              {draft.subtitle ? ` · ${draft.subtitle}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Recipients
              </label>
              {contacts.some((c) => c.suggested) && (
                <button
                  type="button"
                  onClick={selectSuggested}
                  className="text-[11px] font-semibold text-primary-700 hover:underline"
                >
                  Select suggested
                </button>
              )}
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parents, teachers, staff…"
                className="form-input pl-9 h-9 text-xs"
              />
            </div>
            <div className="border border-gray-100 rounded-xl max-h-44 overflow-y-auto divide-y divide-gray-50">
              {loading ? (
                <div className="flex justify-center py-8 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-8 px-3">
                  No contacts available to message.
                </p>
              ) : (
                contacts.map((c) => {
                  const isOn = selected.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isOn ? "bg-primary-50/80" : "hover:bg-gray-50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-5 w-5 rounded-md border flex items-center justify-center shrink-0",
                          isOn
                            ? "bg-primary-600 border-primary-600 text-white"
                            : "border-gray-300 bg-white"
                        )}
                      >
                        {isOn && <Check className="h-3 w-3" />}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {c.avatar || getInitials(c.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-primary-600 font-medium">
                          {c.role}
                          {c.suggested ? " · Suggested" : ""}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              {selected.size} selected · message will be delivered privately to each recipient
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" /> Message preview
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={9}
              className="form-input text-xs font-mono leading-relaxed resize-y min-h-[140px]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center gap-2 bg-gray-50/80">
          <button type="button" onClick={onClose} className="btn-ghost text-sm py-2 px-3 flex-1 sm:flex-none">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || selected.size === 0 || !message.trim()}
            className="btn-primary text-sm py-2 px-4 flex-1 sm:flex-none justify-center disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Share to chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type ShareToChatButtonProps = {
  draft: ShareDraft;
  studentId?: string;
  preferredRecipients?: ShareContact[];
  className?: string;
  variant?: "primary" | "ghost" | "icon";
  label?: string;
  disabled?: boolean;
};

export function ShareToChatButton({
  draft,
  studentId,
  preferredRecipients,
  className,
  variant = "ghost",
  label = "Share to chat",
  disabled,
}: ShareToChatButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!canShare(session?.user?.role)) return null;

  const btnClass =
    variant === "primary"
      ? "btn-primary text-sm py-2 px-3"
      : variant === "icon"
        ? "p-2 rounded-lg text-primary-700 hover:bg-primary-50"
        : "btn-ghost text-sm py-2 px-3";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(btnClass, "inline-flex items-center gap-1.5", className)}
        title={label}
      >
        <Share2 className="h-4 w-4" />
        {variant !== "icon" && <span>{label}</span>}
      </button>
      <ShareToChatModal
        open={open}
        onClose={() => setOpen(false)}
        draft={draft}
        studentId={studentId}
        preferredRecipients={preferredRecipients}
      />
    </>
  );
}

/** Imperative-friendly wrapper: control open state from parent (e.g. after saving). */
export function useShareToChat() {
  const [state, setState] = useState<{
    open: boolean;
    draft: ShareDraft | null;
    studentId?: string;
    preferredRecipients?: ShareContact[];
  }>({ open: false, draft: null });

  const share = useCallback(
    (draft: ShareDraft, opts?: { studentId?: string; preferredRecipients?: ShareContact[] }) => {
      setState({
        open: true,
        draft,
        studentId: opts?.studentId,
        preferredRecipients: opts?.preferredRecipients,
      });
    },
    []
  );

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const modal =
    state.draft && state.open ? (
      <ShareToChatModal
        open={state.open}
        onClose={close}
        draft={state.draft}
        studentId={state.studentId}
        preferredRecipients={state.preferredRecipients}
      />
    ) : null;

  return { share, close, modal };
}
