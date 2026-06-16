"use client";

import { useState } from "react";
import { MessageSquare, Bell, Send, User, Sparkles, Check, Paperclip, Search, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL_THREADS = [
  { id: "t1", name: "Qari Hamid", role: "Teacher", lastMsg: "Ahmad read Juz 13 excellently today.", time: "09:45 AM", unread: true, avatar: "QH" },
  { id: "t2", name: "Sufyan Ahmed (Ahmad's Parent)", role: "Parent", lastMsg: "Assalamu Alaikum, is there class tomorrow?", time: "Yesterday", unread: false, avatar: "SA" },
  { id: "t3", name: "Mufti Asim (Admin)", role: "Administrator", lastMsg: "Monthly feedback reports are due by Saturday.", time: "2 days ago", unread: false, avatar: "MA" },
  { id: "t4", name: "Fatima Noor (Parent)", role: "Parent", lastMsg: "Thank you for the guidance.", time: "3 days ago", unread: false, avatar: "FN" },
];

const INITIAL_MESSAGES: Record<string, any[]> = {
  t1: [
    { sender: "QH", name: "Qari Hamid", text: "Assalamu Alaikum. I wanted to update you on Ahmad's lessons.", time: "09:30 AM", self: false },
    { sender: "self", name: "You", text: "Wa Alaikum Assalam. Sure, how is he progressing with Tajweed rules?", time: "09:35 AM", self: true },
    { sender: "QH", name: "Qari Hamid", text: "Ahmad read Juz 13 excellently today. His makharij are perfect now. Keep practicing Sabaq at home.", time: "09:45 AM", self: false },
  ],
  t2: [
    { sender: "SA", name: "Sufyan Ahmed", text: "Assalamu Alaikum, Qari Saheb. Is there a revision class tomorrow morning?", time: "Yesterday", self: false },
    { sender: "self", name: "You", text: "Wa Alaikum Assalam. Yes, the morning session is on as scheduled.", time: "Yesterday", self: true },
  ],
  t3: [
    { sender: "MA", name: "Mufti Asim", text: "Assalamu Alaikum teachers. Monthly feedback reports are due by Saturday.", time: "2 days ago", self: false },
  ],
  t4: [
    { sender: "FN", name: "Fatima Noor", text: "Assalamu Alaikum. Thank you for the guidance.", time: "3 days ago", self: false },
  ],
};

const INITIAL_ANNOUNCEMENTS = [
  { id: "a1", title: "Eid-ul-Adha Holidays Notice", target: "All", content: "The institute will remain closed from June 16 to June 20, 2025. Classes will resume regularly on June 21.", date: "Today 10:00 AM", author: "Administration" },
  { id: "a2", title: "Quarterly Assessment Schedule", target: "Parents & Students", content: "The assessments will begin on June 22. Detailed syllabus and slots are shared on the student board.", date: "2 days ago", author: "Academic Board" },
  { id: "a3", title: "New Hifz Standard Guidelines", target: "Teachers", content: "Please read the updated Sabaq, Sabqi, and Manzil marking rubric in the settings folder.", date: "5 days ago", author: "QEMS Support" },
];

export function CommunicationContent() {
  const [activeMode, setActiveMode] = useState<"chat" | "announcements">("chat");
  const [threads, setThreads] = useState(INITIAL_THREADS);
  const [selectedThreadId, setSelectedThreadId] = useState("t1");
  const [chatMessages, setChatMessages] = useState(INITIAL_MESSAGES);
  const [inputMsg, setInputMsg] = useState("");
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState("");
  const [annTarget, setAnnTarget] = useState("All");
  const [annContent, setAnnContent] = useState("");
  const [annSaved, setAnnSaved] = useState(false);

  const activeThread = threads.find((t) => t.id === selectedThreadId)!;
  const currentMessages = chatMessages[selectedThreadId] || [];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      sender: "self",
      name: "You",
      text: inputMsg,
      time: "Just now",
      self: true,
    };

    const updatedMessages = {
      ...chatMessages,
      [selectedThreadId]: [...currentMessages, newMsg],
    };

    setChatMessages(updatedMessages);

    // Update last message in threads list
    setThreads(
      threads.map((t) =>
        t.id === selectedThreadId
          ? { ...t, lastMsg: inputMsg, time: "Just now", unread: false }
          : t
      )
    );

    setInputMsg("");
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;

    const newAnn = {
      id: `a-${Date.now()}`,
      title: annTitle,
      target: annTarget,
      content: annContent,
      date: "Just now",
      author: "You",
    };

    setAnnouncements([newAnn, ...announcements]);
    setAnnSaved(true);

    setTimeout(() => {
      setAnnSaved(false);
      setAnnTitle("");
      setAnnContent("");
    }, 1200);
  };

  const selectThread = (id: string) => {
    setSelectedThreadId(id);
    // Mark as read
    setThreads(threads.map((t) => (t.id === id ? { ...t, unread: false } : t)));
  };

  return (
    <div className="space-y-6">
      {/* ── Mode Switcher ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
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
        <div className="grid lg:grid-cols-3 gap-6 h-[600px] border border-border rounded-2xl bg-white overflow-hidden shadow-sm">
          {/* Threads Sidebar */}
          <div className="border-r border-border flex flex-col h-full bg-gray-50/55">
            <div className="p-4 border-b border-border bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  className="form-input pl-9 h-9 text-xs"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {threads.map((t) => (
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
                    <span className="inline-block text-[9px] text-primary-600 font-semibold mt-1">
                      {t.role}
                    </span>
                  </div>
                  {t.unread && (
                    <div className="h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Panel */}
          <div className="lg:col-span-2 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                  {activeThread.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{activeThread.name}</p>
                  <p className="text-[10px] text-primary-600 font-medium">{activeThread.role}</p>
                </div>
              </div>
            </div>

            {/* Chat list */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
              {currentMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn("flex flex-col max-w-[75%]", msg.self ? "ml-auto items-end" : "mr-auto items-start")}
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

            {/* Input bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-white flex items-center gap-2">
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
              <button
                type="submit"
                className="btn-primary p-2.5 h-10 w-10 flex items-center justify-center rounded-xl"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {activeMode === "announcements" && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Announcements Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-gray-900">Broadcast History</h3>
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="dash-card p-5">
                  <div className="flex items-center justify-between mb-2">
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
          </div>

          {/* Publish announcement form */}
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
                  <select
                    value={annTarget}
                    onChange={(e) => setAnnTarget(e.target.value)}
                    className="form-input text-xs"
                  >
                    <option value="All">All Portal Users</option>
                    <option value="Parents & Students">Parents & Students</option>
                    <option value="Teachers">Teachers</option>
                    <option value="Administration">Administration</option>
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

                <button
                  type="submit"
                  className="btn-primary w-full justify-center text-xs py-2.5 mt-2"
                  disabled={annSaved}
                >
                  {annSaved ? "Publishing Notice..." : "Publish Announcement"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
