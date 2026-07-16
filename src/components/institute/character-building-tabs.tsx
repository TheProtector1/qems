"use client";

import { useState } from "react";
import { HeartHandshake, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CharacterBuildingContent } from "@/components/institute/character-building-content";
import { DailyDuasContent } from "@/components/institute/daily-duas-content";

const TABS = [
  { id: "tasks", label: "Character Tasks", icon: HeartHandshake },
  { id: "duas", label: "Daily Duas", icon: Moon },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function CharacterBuildingTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("tasks");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "tasks" ? <CharacterBuildingContent /> : <DailyDuasContent />}
    </div>
  );
}
