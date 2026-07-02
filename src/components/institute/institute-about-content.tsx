"use client";

import { useCallback, useEffect, useState, type ElementType, type ReactNode } from "react";
import {
  BookOpen, Sparkles, Target, Award, Heart, Loader2, Save, Pencil, Eye,
  Plus, Trash2, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  InstituteAchievement,
  InstituteGoal,
  InstituteProfilePayload,
  InstituteValue,
} from "@/lib/institute-profile";

export function InstituteAboutContent({
  canEdit = true,
  initialProfile,
}: {
  canEdit?: boolean;
  initialProfile?: InstituteProfilePayload | null;
}) {
  const [profile, setProfile] = useState<InstituteProfilePayload | null>(initialProfile || null);
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/profile");
      if (!res.ok) throw new Error("Failed to load institute profile");
      const data = await res.json();
      setProfile(data.profile);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialProfile) load();
  }, [initialProfile, load]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/institute/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline: profile.tagline,
          description: profile.description,
          vision: profile.vision,
          mission: profile.mission,
          goals: profile.goals,
          values: profile.values,
          achievements: profile.achievements,
          foundedYear: profile.foundedYear,
          website: profile.website,
          address: profile.address,
          city: profile.city,
          directorName: profile.directorName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProfile(data.profile);
      setMode("preview");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateGoal = (index: number, patch: Partial<InstituteGoal>) => {
    if (!profile) return;
    const goals = [...profile.goals];
    goals[index] = { ...goals[index], ...patch };
    setProfile({ ...profile, goals });
  };

  const updateValue = (index: number, patch: Partial<InstituteValue>) => {
    if (!profile) return;
    const values = [...profile.values];
    values[index] = { ...values[index], ...patch };
    setProfile({ ...profile, values });
  };

  const updateAchievement = (index: number, patch: Partial<InstituteAchievement>) => {
    if (!profile) return;
    const achievements = [...profile.achievements];
    achievements[index] = { ...achievements[index], ...patch };
    setProfile({ ...profile, achievements });
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading institute profile…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-700" />
            About Our Institute
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Share your vision, mission, goals, and achievements with staff and families
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-green-600 font-medium">Saved successfully</span>}
            <button
              type="button"
              onClick={() => setMode(mode === "preview" ? "edit" : "preview")}
              className="btn-ghost text-sm py-2"
            >
              {mode === "preview" ? (
                <><Pencil className="h-4 w-4" /> Edit content</>
              ) : (
                <><Eye className="h-4 w-4" /> Preview</>
              )}
            </button>
            {mode === "edit" && (
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save</>}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      {mode === "edit" ? (
        <div className="space-y-6">
          <EditorSection title="Identity" icon={Building2}>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-gray-600">Tagline</span>
                <input className="input mt-1 w-full" placeholder="A short motto for your institute" value={profile.tagline || ""} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-gray-600">About the institute</span>
                <textarea className="input mt-1 w-full min-h-[100px]" value={profile.description || ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Founded year</span>
                <input type="number" className="input mt-1 w-full" value={profile.foundedYear || ""} onChange={(e) => setProfile({ ...profile, foundedYear: e.target.value ? Number(e.target.value) : null })} />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600">Director / head</span>
                <input className="input mt-1 w-full" value={profile.directorName || ""} onChange={(e) => setProfile({ ...profile, directorName: e.target.value })} />
              </label>
            </div>
          </EditorSection>

          <EditorSection title="Vision & mission" icon={Sparkles}>
            <label className="block mb-4">
              <span className="text-xs font-semibold text-gray-600">Vision</span>
              <textarea className="input mt-1 w-full min-h-[90px]" value={profile.vision || ""} onChange={(e) => setProfile({ ...profile, vision: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600">Mission</span>
              <textarea className="input mt-1 w-full min-h-[90px]" value={profile.mission || ""} onChange={(e) => setProfile({ ...profile, mission: e.target.value })} />
            </label>
          </EditorSection>

          <ListEditorSection
            title="Strategic goals"
            icon={Target}
            emptyLabel="Add goal"
            items={profile.goals}
            onAdd={() => setProfile({ ...profile, goals: [...profile.goals, { title: "", description: "" }] })}
            onRemove={(i) => setProfile({ ...profile, goals: profile.goals.filter((_, idx) => idx !== i) })}
            renderItem={(item, i) => (
              <div className="grid gap-3">
                <input className="input w-full" placeholder="Goal title" value={item.title} onChange={(e) => updateGoal(i, { title: e.target.value })} />
                <textarea className="input w-full min-h-[60px]" placeholder="Description" value={item.description} onChange={(e) => updateGoal(i, { description: e.target.value })} />
              </div>
            )}
          />

          <ListEditorSection
            title="Core values"
            icon={Heart}
            emptyLabel="Add value"
            items={profile.values}
            onAdd={() => setProfile({ ...profile, values: [...profile.values, { title: "", description: "" }] })}
            onRemove={(i) => setProfile({ ...profile, values: profile.values.filter((_, idx) => idx !== i) })}
            renderItem={(item, i) => (
              <div className="grid gap-3">
                <input className="input w-full" placeholder="Value title" value={item.title} onChange={(e) => updateValue(i, { title: e.target.value })} />
                <textarea className="input w-full min-h-[60px]" placeholder="What this means in practice" value={item.description} onChange={(e) => updateValue(i, { description: e.target.value })} />
              </div>
            )}
          />

          <ListEditorSection
            title="Achievements & milestones"
            icon={Award}
            emptyLabel="Add achievement"
            items={profile.achievements}
            onAdd={() => setProfile({ ...profile, achievements: [...profile.achievements, { year: String(new Date().getFullYear()), title: "", description: "" }] })}
            onRemove={(i) => setProfile({ ...profile, achievements: profile.achievements.filter((_, idx) => idx !== i) })}
            renderItem={(item, i) => (
              <div className="grid sm:grid-cols-4 gap-3">
                <input className="input w-full" placeholder="Year" value={item.year} onChange={(e) => updateAchievement(i, { year: e.target.value })} />
                <input className="input w-full sm:col-span-3" placeholder="Achievement title" value={item.title} onChange={(e) => updateAchievement(i, { title: e.target.value })} />
                <textarea className="input w-full min-h-[60px] sm:col-span-4" placeholder="Details" value={item.description} onChange={(e) => updateAchievement(i, { description: e.target.value })} />
              </div>
            )}
          />
        </div>
      ) : (
        <AboutPreview profile={profile} />
      )}
    </div>
  );
}

function EditorSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <div className="dash-card bg-white p-5 sm:p-6">
      <h3 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-primary-700" /> {title}
      </h3>
      {children}
    </div>
  );
}

function ListEditorSection<T>({
  title,
  icon: Icon,
  items,
  onAdd,
  onRemove,
  renderItem,
  emptyLabel,
}: {
  title: string;
  icon: ElementType;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  emptyLabel: string;
}) {
  return (
    <div className="dash-card bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-gray-900 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary-700" /> {title}
        </h3>
        <button type="button" onClick={onAdd} className="btn-ghost text-xs py-1.5">
          <Plus className="h-3.5 w-3.5" /> {emptyLabel}
        </button>
      </div>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Nothing added yet.</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-100 p-4 relative">
              <button type="button" onClick={() => onRemove(i)} className="absolute top-3 right-3 p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
              {renderItem(item, i)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AboutPreview({ profile }: { profile: InstituteProfilePayload }) {
  return (
    <div className="space-y-6">
      <div className="dash-card bg-white overflow-hidden border border-gray-200/80">
        <div className="px-6 sm:px-8 py-8 sm:py-10 border-b border-gray-100 bg-gradient-to-br from-slate-50 to-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Our Institute</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mt-2">{profile.name}</h1>
          {profile.tagline && (
            <p className="text-lg text-gray-600 mt-2 max-w-2xl">{profile.tagline}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
            {profile.foundedYear && <span>Est. {profile.foundedYear}</span>}
            {profile.city && <span>{profile.city}, {profile.country}</span>}
            {profile.directorName && <span>Led by {profile.directorName}</span>}
          </div>
        </div>

        {profile.description && (
          <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
            <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">{profile.description}</p>
          </div>
        )}

        {(profile.vision || profile.mission) && (
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {profile.vision && (
              <div className="px-6 sm:px-8 py-6">
                <h3 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary-700" /> Vision
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.vision}</p>
              </div>
            )}
            {profile.mission && (
              <div className="px-6 sm:px-8 py-6">
                <h3 className="font-display font-bold text-gray-900 flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary-700" /> Mission
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.mission}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {profile.goals.length > 0 && (
        <div className="dash-card bg-white p-6 sm:p-8">
          <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
            <Target className="h-5 w-5 text-primary-700" /> Strategic goals
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {profile.goals.map((g, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                <p className="font-semibold text-gray-900">{g.title}</p>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{g.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.values.length > 0 && (
        <div className="dash-card bg-white p-6 sm:p-8">
          <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
            <Heart className="h-5 w-5 text-primary-700" /> Core values
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {profile.values.map((v, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-5">
                <p className="font-semibold text-gray-900">{v.title}</p>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.achievements.length > 0 && (
        <div className="dash-card bg-white p-6 sm:p-8">
          <h3 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
            <Award className="h-5 w-5 text-primary-700" /> Achievements & milestones
          </h3>
          <div className="space-y-4">
            {[...profile.achievements]
              .sort((a, b) => (b.year || "").localeCompare(a.year || ""))
              .map((a, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="inline-block rounded-lg bg-primary-50 text-primary-800 text-xs font-bold px-2 py-1">
                      {a.year || "—"}
                    </span>
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    {a.description && <p className="text-sm text-gray-600 mt-1">{a.description}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {!profile.description && !profile.vision && !profile.mission && profile.goals.length === 0 && (
        <div className="dash-card bg-white p-12 text-center border border-dashed border-gray-200">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-600">Your institute story is not published yet</p>
          <p className="text-xs text-gray-400 mt-1">Switch to edit mode to add your vision, goals, and achievements.</p>
        </div>
      )}
    </div>
  );
}
