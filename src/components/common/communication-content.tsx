"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useDeferredValue,
  startTransition,
} from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Bell,
  Send,
  Sparkles,
  Check,
  CheckCheck,
  Search,
  PlusCircle,
  Loader2,
  ArrowLeft,
  Pin,
  PinOff,
  Users,
  X,
  Inbox,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type Thread = {
  id: string;
  name: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  avatar: string;
  createdAt?: string;
};

type Contact = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email?: string;
};

type ChatMessage = {
  id?: string;
  sender: string;
  name: string;
  text: string;
  time: string;
  createdAt?: string;
  self: boolean;
  isRead?: boolean;
  readAt?: string | null;
};

type Announcement = {
  id: string;
  title: string;
  target: string;
  content: string;
  date: string;
  author: string;
  isPinned?: boolean;
};

type TargetOption = { value: string; label: string };

const POLL_MS = 8000;

export function CommunicationContent() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isParent = role === "PARENT";
  const isTeacher = role === "TEACHER";
  const canManageAnnouncements =
    role === "INSTITUTE_OWNER" ||
    role === "BRANCH_MANAGER" ||
    role === "SUPER_ADMIN" ||
    role === "TEACHER";

  const messagesApi = isParent
    ? "/api/parent/messages"
    : isTeacher
      ? "/api/teacher/messages"
      : "/api/institute/messages";

  const canChat =
    isParent ||
    isTeacher ||
    role === "INSTITUTE_OWNER" ||
    role === "BRANCH_MANAGER" ||
    role === "SUPER_ADMIN";

  const [activeMode, setActiveMode] = useState<"chat" | "announcements">("chat");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [targets, setTargets] = useState<TargetOption[]>([
    { value: "All", label: "Everyone" },
    { value: "Teachers", label: "Teachers" },
    { value: "Parents", label: "Parents" },
    { value: "Students", label: "Students" },
    { value: "Parents & Students", label: "Parents & Students" },
    { value: "Staff", label: "Leadership & Staff" },
  ]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const [threadSearch, setThreadSearch] = useState("");
  const deferredSearch = useDeferredValue(threadSearch);

  const [composeOpen, setComposeOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);

  const [annTitle, setAnnTitle] = useState("");
  const [annTarget, setAnnTarget] = useState("All");
  const [annContent, setAnnContent] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [annSaving, setAnnSaving] = useState(false);
  const [annSaved, setAnnSaved] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    selectedRef.current = selectedThreadId;
  }, [selectedThreadId]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  const loadThreads = useCallback(
    async (opts?: { quiet?: boolean; q?: string }) => {
      if (!canChat) return;
      try {
        const params = new URLSearchParams();
        if (opts?.q) params.set("q", opts.q);
        const url = params.toString() ? `${messagesApi}?${params}` : messagesApi;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const list: Thread[] = data.threads || [];
        setThreads(list);
        setUnreadTotal(data.unreadTotal ?? list.reduce((s, t) => s + (t.unreadCount || 0), 0));

        if (list.length > 0 && !selectedRef.current) {
          startTransition(() => setSelectedThreadId(list[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    },
    [canChat, messagesApi]
  );

  const loadAnnouncements = useCallback(async () => {
    try {
      const url = isParent ? "/api/parent/announcements" : "/api/institute/announcements";
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      setAnnouncements(data.announcements || []);
      if (data.targets?.length) setTargets(data.targets);
    } catch (err) {
      console.error(err);
    }
  }, [isParent]);

  const loadMessages = useCallback(
    async (partnerId: string, opts?: { quiet?: boolean }) => {
      if (!canChat) return;
      if (!opts?.quiet) setMessagesLoading(true);
      try {
        const res = await fetch(`${messagesApi}?partnerId=${partnerId}`);
        if (!res.ok) return;
        const data = await res.json();
        const next: ChatMessage[] = data.messages || [];
        setChatMessages((prev) => {
          if (
            opts?.quiet &&
            prev.length === next.length &&
            prev[prev.length - 1]?.id === next[next.length - 1]?.id &&
            prev[prev.length - 1]?.isRead === next[next.length - 1]?.isRead
          ) {
            return prev;
          }
          return next;
        });
        setThreads((prev) =>
          prev.map((t) =>
            t.id === partnerId ? { ...t, unread: false, unreadCount: 0 } : t
          )
        );
      } catch (err) {
        console.error(err);
        if (!opts?.quiet) setChatMessages([]);
      } finally {
        if (!opts?.quiet) setMessagesLoading(false);
      }
    },
    [canChat, messagesApi]
  );

  const loadContacts = useCallback(
    async (q?: string) => {
      setContactsLoading(true);
      try {
        const params = new URLSearchParams({ directory: "1" });
        if (q) params.set("q", q);
        const res = await fetch(`${messagesApi}?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setContactsLoading(false);
      }
    },
    [messagesApi]
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([loadThreads(), loadAnnouncements()]).finally(() => setLoading(false));
  }, [loadThreads, loadAnnouncements]);

  useEffect(() => {
    if (!canChat) return;
    const t = setTimeout(() => {
      loadThreads({ quiet: true, q: deferredSearch || undefined });
    }, 250);
    return () => clearTimeout(t);
  }, [deferredSearch, canChat, loadThreads]);

  useEffect(() => {
    if (selectedThreadId) loadMessages(selectedThreadId);
  }, [selectedThreadId, loadMessages]);

  useEffect(() => {
    if (!messagesLoading && chatMessages.length) {
      scrollToBottom(false);
    }
  }, [messagesLoading, selectedThreadId, scrollToBottom]);

  useEffect(() => {
    if (chatMessages.length) scrollToBottom(true);
  }, [chatMessages.length, scrollToBottom]);

  // Live polling for threads + active conversation
  useEffect(() => {
    if (!canChat || activeMode !== "chat") return;
    const id = window.setInterval(() => {
      loadThreads({ quiet: true, q: deferredSearch || undefined });
      if (selectedRef.current) {
        loadMessages(selectedRef.current, { quiet: true });
      }
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [canChat, activeMode, deferredSearch, loadThreads, loadMessages]);

  useEffect(() => {
    if (!composeOpen) return;
    loadContacts(contactSearch || undefined);
  }, [composeOpen, contactSearch, loadContacts]);

  const activeThread =
    threads.find((t) => t.id === selectedThreadId) ||
    (selectedThreadId
      ? contacts.find((c) => c.id === selectedThreadId)
        ? {
            id: selectedThreadId,
            name: contacts.find((c) => c.id === selectedThreadId)!.name,
            role: contacts.find((c) => c.id === selectedThreadId)!.role,
            lastMsg: "",
            time: "",
            unread: false,
            avatar: contacts.find((c) => c.id === selectedThreadId)!.avatar,
          }
        : null
      : null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputMsg.trim();
    if (!text || !selectedThreadId || sending) return;

    setSending(true);
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: getInitials(session?.user?.name || "Me"),
      name: session?.user?.name || "You",
      text,
      time: "Just now",
      createdAt: new Date().toISOString(),
      self: true,
      isRead: false,
    };
    setChatMessages((prev) => [...prev, optimistic]);
    setInputMsg("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(messagesApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: selectedThreadId, content: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m))
        );
        setThreads((prev) => {
          const exists = prev.some((t) => t.id === selectedThreadId);
          if (!exists && activeThread) {
            return [
              {
                id: selectedThreadId,
                name: activeThread.name,
                role: activeThread.role,
                lastMsg: text,
                time: "Just now",
                unread: false,
                unreadCount: 0,
                avatar: activeThread.avatar,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ];
          }
          return prev.map((t) =>
            t.id === selectedThreadId
              ? { ...t, lastMsg: text, time: "Just now", unread: false, unreadCount: 0 }
              : t
          );
        });
      } else {
        setChatMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInputMsg(text);
      }
    } catch {
      setChatMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputMsg(text);
    } finally {
      setSending(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim() || annSaving) return;

    setAnnSaving(true);
    try {
      const res = await fetch("/api/institute/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          target: annTarget,
          isPinned: annPinned,
        }),
      });

      if (res.ok) {
        setAnnSaved(true);
        await loadAnnouncements();
        setTimeout(() => {
          setAnnSaved(false);
          setAnnTitle("");
          setAnnContent("");
          setAnnPinned(false);
        }, 1200);
      }
    } finally {
      setAnnSaving(false);
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    if (!canManageAnnouncements || isParent) return;
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPinned: !isPinned } : a))
    );
    const res = await fetch("/api/institute/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPinned: !isPinned }),
    });
    if (!res.ok) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isPinned } : a))
      );
    } else {
      await loadAnnouncements();
    }
  };

  const selectThread = (id: string) => {
    setSelectedThreadId(id);
    setMobileChatOpen(true);
    setComposeOpen(false);
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, unread: false, unreadCount: 0 } : t))
    );
  };

  const startChatWith = (contact: Contact) => {
    setThreads((prev) => {
      if (prev.some((t) => t.id === contact.id)) return prev;
      return [
        {
          id: contact.id,
          name: contact.name,
          role: contact.role,
          lastMsg: "New conversation",
          time: "",
          unread: false,
          unreadCount: 0,
          avatar: contact.avatar || getInitials(contact.name),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
    selectThread(contact.id);
    setComposeOpen(false);
  };

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading communication hub...
      </div>
    );
  }

  const chatLabel = isParent
    ? "Messages"
    : isTeacher
      ? "Parent & Staff Chat"
      : "Direct Messaging";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">Communication</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isParent
              ? "Message teachers and stay updated with institute notices."
              : isTeacher
                ? "Coordinate with parents and leadership in one place."
                : "Message your community and publish clear, targeted notices."}
          </p>
        </div>
        {canChat && unreadTotal > 0 && activeMode === "chat" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg self-start">
            <Inbox className="h-3.5 w-3.5" />
            {unreadTotal} unread
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        {canChat && (
          <button
            onClick={() => setActiveMode("chat")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeMode === "chat"
                ? "bg-white text-primary-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <MessageSquare className="h-4 w-4" /> {chatLabel}
            {unreadTotal > 0 && (
              <span className="ml-0.5 min-w-[1.1rem] h-4 px-1 rounded-full bg-primary-600 text-white text-[10px] flex items-center justify-center">
                {unreadTotal > 99 ? "99+" : unreadTotal}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveMode("announcements")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeMode === "announcements"
              ? "bg-white text-primary-800 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Bell className="h-4 w-4" /> {isParent ? "Institute Notices" : "Notice Board"}
        </button>
      </div>

      {activeMode === "chat" && canChat && (
        <div className="border border-border rounded-2xl bg-white overflow-hidden shadow-sm min-h-[min(72dvh,640px)] lg:min-h-[640px] flex flex-col lg:grid lg:grid-cols-[320px_1fr] relative">
          {/* Thread list / compose */}
          <div
            className={cn(
              "border-b lg:border-b-0 lg:border-r border-border flex flex-col bg-gray-50/55 min-h-0",
              mobileChatOpen && selectedThreadId ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
            )}
          >
            <div className="p-3 border-b border-border bg-white space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search conversations..."
                    value={threadSearch}
                    onChange={(e) => setThreadSearch(e.target.value)}
                    className="form-input pl-9 h-9 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setComposeOpen((v) => !v);
                    setContactSearch("");
                  }}
                  className="btn-primary h-9 px-3 text-xs gap-1.5 shrink-0"
                  title="New conversation"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            </div>

            {composeOpen ? (
              <div className="flex-1 overflow-y-auto flex flex-col bg-white">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-primary-50/40">
                  <p className="text-xs font-semibold text-primary-800 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Start a conversation
                  </p>
                  <button
                    type="button"
                    onClick={() => setComposeOpen(false)}
                    className="p-1 rounded-md text-gray-500 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 border-b border-border">
                  <input
                    type="search"
                    placeholder="Find by name or role..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="form-input h-9 text-xs"
                    autoFocus
                  />
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {contactsLoading ? (
                    <div className="flex justify-center py-10 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-12 px-4">
                      No contacts found.
                    </p>
                  ) : (
                    contacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => startChatWith(c)}
                        className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                          {c.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                          <p className="text-[11px] text-primary-600 font-medium">{c.role}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {threads.length === 0 ? (
                  <div className="text-center py-14 px-6">
                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600">No conversations yet</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                      Start a new chat to message someone in your institute.
                    </p>
                    <button
                      type="button"
                      onClick={() => setComposeOpen(true)}
                      className="btn-primary text-xs py-2 px-3 mx-auto"
                    >
                      <PlusCircle className="h-4 w-4" /> New conversation
                    </button>
                  </div>
                ) : (
                  threads.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => selectThread(t.id)}
                      className={cn(
                        "w-full text-left p-3.5 flex items-center gap-3 transition-colors hover:bg-gray-50",
                        selectedThreadId === t.id && "bg-primary-50/70 border-r-4 border-primary-600"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                          {t.avatar}
                        </div>
                        {(t.unreadCount || 0) > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-primary-600 text-white text-[9px] font-bold flex items-center justify-center">
                            {t.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm truncate",
                              t.unread ? "font-bold text-gray-900" : "font-semibold text-gray-900"
                            )}
                          >
                            {t.name}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">{t.time}</span>
                        </div>
                        <p
                          className={cn(
                            "text-xs truncate mt-0.5",
                            t.unread ? "text-gray-700 font-medium" : "text-gray-500"
                          )}
                        >
                          {t.lastMsg}
                        </p>
                        <span className="inline-block text-[9px] text-primary-600 font-semibold mt-1">
                          {t.role}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Chat pane */}
          <div
            className={cn(
              "flex flex-col min-h-0 flex-1",
              mobileChatOpen && selectedThreadId ? "flex" : "hidden lg:flex"
            )}
          >
            {activeThread ? (
              <>
                <div className="p-3 sm:p-4 border-b border-border flex items-center gap-3 bg-white">
                  <button
                    type="button"
                    onClick={() => setMobileChatOpen(false)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                      {activeThread.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {activeThread.name}
                      </p>
                      <p className="text-[10px] text-primary-600 font-medium">
                        {activeThread.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  ref={chatContainerRef}
                  className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] min-h-0"
                >
                  {messagesLoading ? (
                    <div className="flex justify-center py-8 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-gray-500 font-medium">Say salaam to start</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Messages are private between you and {activeThread.name}.
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => {
                      const showDay =
                        i === 0 ||
                        (msg.createdAt &&
                          chatMessages[i - 1]?.createdAt &&
                          msg.createdAt.slice(0, 10) !==
                            chatMessages[i - 1].createdAt!.slice(0, 10));
                      return (
                        <div key={msg.id || i}>
                          {showDay && msg.createdAt && (
                            <div className="flex justify-center my-3">
                              <span className="text-[10px] font-medium text-gray-500 bg-white/80 border border-gray-100 px-2.5 py-0.5 rounded-full">
                                {new Date(msg.createdAt).toLocaleDateString("en-PK", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}
                          <div
                            className={cn(
                              "flex flex-col max-w-[85%] sm:max-w-[72%]",
                              msg.self ? "ml-auto items-end" : "mr-auto items-start"
                            )}
                          >
                            <div
                              className={cn(
                                "rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                                msg.self
                                  ? "bg-gradient-primary text-white rounded-br-md"
                                  : "bg-white text-gray-800 border border-gray-100 rounded-bl-md"
                              )}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 mt-1 px-1">
                              <span className="text-[9px] text-gray-400">{msg.time}</span>
                              {msg.self && (
                                <span className="text-primary-600" title={msg.isRead ? "Read" : "Sent"}>
                                  {msg.isRead ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3 text-gray-400" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-border bg-white flex items-end gap-2 shrink-0"
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                    value={inputMsg}
                    onChange={(e) => {
                      setInputMsg(e.target.value);
                      autoGrow(e.target);
                    }}
                    onKeyDown={onComposerKeyDown}
                    className="form-input flex-1 text-xs py-2.5 min-h-[40px] max-h-[140px] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMsg.trim() || sending}
                    className="btn-primary p-2.5 h-10 w-10 flex items-center justify-center rounded-xl disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-400">
                <MessageSquare className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium text-gray-600">Select a conversation</p>
                <p className="text-xs mt-1 max-w-xs">
                  Choose someone from the list, or start a new chat to begin messaging.
                </p>
                <button
                  type="button"
                  onClick={() => setComposeOpen(true)}
                  className="btn-primary text-xs py-2 px-3 mt-4"
                >
                  <PlusCircle className="h-4 w-4" /> New conversation
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeMode === "announcements" && (
        <div className={cn("grid gap-6", canManageAnnouncements && !isParent && "lg:grid-cols-3")}>
          <div className={cn("space-y-4", canManageAnnouncements && !isParent && "lg:col-span-2")}>
            <h3 className="font-semibold text-gray-900">
              {isParent ? "Announcements from Institute" : "Published notices"}
            </h3>
            {announcements.length === 0 ? (
              <div className="dash-card p-10 text-center">
                <Bell className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No announcements published yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={cn(
                      "dash-card p-5 transition-shadow hover:shadow-md",
                      ann.isPinned && "ring-1 ring-primary-200 bg-primary-50/20"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {ann.isPinned && (
                          <Pin className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
                        )}
                        <h4 className="font-bold text-gray-900 text-base">{ann.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="pill pill-primary text-[10px] py-0.5 px-2">
                          {ann.target}
                        </span>
                        {canManageAnnouncements && !isParent && (
                          <button
                            type="button"
                            onClick={() => togglePin(ann.id, Boolean(ann.isPinned))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-700 hover:bg-primary-50"
                            title={ann.isPinned ? "Unpin" : "Pin to top"}
                          >
                            {ann.isPinned ? (
                              <PinOff className="h-4 w-4" />
                            ) : (
                              <Pin className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">
                      {ann.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <span>By {ann.author}</span>
                      <span>{ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {canManageAnnouncements && !isParent && (
            <div>
              <div className="dash-card p-6 bg-white border border-border sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
                  <PlusCircle className="h-5 w-5 text-primary-700" /> Create Broadcast
                </h3>
                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mid-term break notice"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      className="form-input text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Audience
                    </label>
                    <select
                      value={annTarget}
                      onChange={(e) => setAnnTarget(e.target.value)}
                      className="form-input text-xs"
                    >
                      {targets.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Message
                    </label>
                    <textarea
                      placeholder="Write a clear notice for your audience…"
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="form-input h-28 py-2.5 resize-none text-xs"
                      required
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={annPinned}
                      onChange={(e) => setAnnPinned(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Pin to top of notice board
                  </label>
                  <button
                    type="submit"
                    className="btn-primary w-full justify-center text-xs py-2.5 mt-1"
                    disabled={annSaving || annSaved}
                  >
                    {annSaved ? (
                      <>
                        <Check className="h-4 w-4" /> Published
                      </>
                    ) : annSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Publish Announcement
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
