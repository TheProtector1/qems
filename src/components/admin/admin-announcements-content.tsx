"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, Plus, Calendar, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

type Announcement = {
  id: string;
  title: string;
  target: string;
  content: string;
  date: string;
  author: string;
};

export function AdminAnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error(err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading announcements...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary-700" /> Platform-Wide Broadcasts
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Post global notifications and scheduled maintenance alerts to all accounts</p>
        </div>
        <Link href="/admin/announcements/new" className="btn-primary text-xs py-2">
          <Plus className="h-4 w-4" /> Create Broadcast
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-gray-900">Broadcast Log</h3>
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No platform announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="dash-card p-5 bg-white border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-950 text-base">{ann.title}</h4>
                    <span className="pill pill-primary text-[10px] py-0.5 px-2">{ann.target}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{ann.content}</p>
                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span>Published by: <strong>{ann.author}</strong></span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {ann.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card p-5 bg-amber-50 border border-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 text-sm mb-1">Broadcast Guidelines</h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                Use platform broadcasts sparingly for maintenance windows, security advisories, and major feature releases only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
