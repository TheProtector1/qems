"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Bell, Send, Sparkles, Check, Paperclip, Search, PlusCircle, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  name: string;
  role: string;
  lastMsg: string;
  time: string;
  unread: boolean;
  avatar: string;
};

type ChatMessage = {
  id?: string;
  sender: string;
  name: string;
  text: string;
  time: string;
  self: boolean;
};

type Announcement = {
  id: string;
  title: string;
  target: string;
  content: string;
  date: string;
  author: string;
};

export function CommunicationContent() {
  const [activeMode, setActiveMode] = useState<"chat" | "announcements">("chat");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [annTitle, setAnnTitle] = useState("");
  const [annTarget, setAnnTarget] = useState("All");
  const [annContent, setAnnContent] = useState("");
  const [annSaved, setAnnSaved] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/institute/messages");
      if (!res.ok) return;
      const data = await res.json();
      const list: Thread[] = data.threads || [];
      setThreads(list);
      if (list.length > 0 && !selectedThreadId) {
        setSelectedThreadId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedThreadId]);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/institute/announcements");
      if (!res.ok) return;
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadMessages = useCallback(async (partnerId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/institute/messages?partnerId=${partnerId}`);
      if (!res.ok) return;
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (err) {
      console.error(err);
      setChatMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadThreads(), loadAnnouncements()]).finally(() => setLoading(false));
  }, [loadThreads, loadAnnouncements]);

  useEffect(() => {
    if (selectedThreadId) loadMessages(selectedThreadId);
  }, [selectedThreadId, loadMessages]);

  const activeThread = threads.find((t) => t.id === selectedThreadId);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedThreadId) return;

    const res = await fetch("/api/institute/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: selectedThreadId, content: inputMsg }),
    });

    if (res.ok) {
      const data = await res.json();
      setChatMessages((prev) => [...prev, data.message]);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThreadId
            ? { ...t, lastMsg: inputMsg, time: "Just now", unread: false }
            : t
        )
      );
      setInputMsg("");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    const res = await fetch("/api/institute/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: annTitle, content: annContent, target: annTarget }),
    });

    if (res.ok) {
      setAnnSaved(true);
      await loadAnnouncements();
      setTimeout(() => {
        setAnnSaved(false);
        setAnnTitle("");
        setAnnContent("");
      }, 1200);
    }
  };

  const selectThread = (id: string) => {
    setSelectedThreadId(id);
    setMobileChatOpen(true);
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading communication hub...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveMode("chat")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeMode === "chat" ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <MessageSquare className="h-4 w-4" /> Direct Messaging
        </button>
        <button
          onClick={() => setActiveMode("announcements")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeMode === "announcements" ? "bg-white text-primary-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Bell className="h-4 w-4" /> Broadcast Notice Board
        </button>
      </div>

      {activeMode === "chat" && (
        <div className="border border-border rounded-2xl bg-white overflow-hidden shadow-sm min-h-[min(70dvh,600px)] lg:min-h-[600px] flex flex-col lg:grid lg:grid-cols-3 lg:gap-0">
          <div
            className={cn(
              "border-b lg:border-b-0 lg:border-r border-border flex flex-col bg-gray-50/55 min-h-0",
              "lg:col-span-1",
              mobileChatOpen && selectedThreadId ? "hidden lg:flex" : "flex flex-1 lg:flex-none"
            )}
          >
            <div className="p-4 border-b border-border bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search chats..." className="form-input pl-9 h-9 text-xs" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {threads.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-12 px-4">No conversations yet.</p>
              ) : threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectThread(t.id)}
                  className={cn(
                    "w-full text-left p-4 flex items-center gap-3 transition-colors hover:bg-gray-50",
                    selectedThreadId === t.id && "bg-primary-50/70 border-r-4 border-primary-600"
                  )}
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm truncate">{t.name}</p>
                      <span className="text-[10px] text-gray-400">{t.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{t.lastMsg}</p>
                    <span className="inline-block text-[9px] text-primary-600 font-semibold mt-1">{t.role}</span>
                  </div>
                  {t.unread && <div className="h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              "lg:col-span-2 flex flex-col min-h-0 flex-1",
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
                      <p className="font-semibold text-gray-900 text-sm truncate">{activeThread.name}</p>
                      <p className="text-[10px] text-primary-600 font-medium">{activeThread.role}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gray-50/30 min-h-0">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8 text-gray-400">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-8">No messages yet. Start the conversation.</p>
                  ) : chatMessages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", msg.self ? "ml-auto items-end" : "mr-auto items-start")}
                    >
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5 text-sm",
                        msg.self
                          ? "bg-gradient-primary text-white rounded-br-none shadow-sm"
                          : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
                      )}>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border bg-white flex items-center gap-2 shrink-0">
                  <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="form-input flex-1 h-10 text-xs"
                  />
                  <button type="submit" className="btn-primary p-2.5 h-10 w-10 flex items-center justify-center rounded-xl">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start messaging.
              </div>
            )}
          </div>
        </div>
      )}

      {activeMode === "announcements" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-900">Broadcast History</h3>
            {announcements.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No announcements published yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="dash-card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h4 className="font-bold text-gray-900 text-base">{ann.title}</h4>
                      <span className="pill pill-primary text-[10px] py-0.5 px-2">Target: {ann.target}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{ann.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                      <span>By: {ann.author}</span>
                      <span>{ann.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="dash-card p-6 bg-white border border-border">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
                <PlusCircle className="h-5 w-5 text-primary-700" /> Create Broadcast
              </h3>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Announcement Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Holidays Notice"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Target Audience</label>
                  <select value={annTarget} onChange={(e) => setAnnTarget(e.target.value)} className="form-input text-xs">
                    <option value="All">All Portal Users</option>
                    <option value="Parents & Students">Parents & Students</option>
                    <option value="Teachers">Teachers</option>
                    <option value="Parents">Parents</option>
                    <option value="Students">Students</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notice Content</label>
                  <textarea
                    placeholder="Compose announcement body..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="form-input h-24 py-2.5 resize-none text-xs"
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full justify-center text-xs py-2.5 mt-2" disabled={annSaved}>
                  {annSaved ? (
                    <><Check className="h-4 w-4" /> Published</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Publish Announcement</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
