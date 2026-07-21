"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

type Guardian = {
  parentId: string;
  relation: string;
  isPrimary: boolean;
  canPickup?: boolean;
  name: string | null;
  phone: string | null;
  email: string | null;
  userId: string;
  linkId: string | null;
};

export function StudentGuardiansPanel({ studentId }: { studentId: string }) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    relation: "Mother",
    password: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/institute/guardians?studentId=${studentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load guardians");
      setGuardians(data.guardians || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
      setGuardians([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const addGuardian = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/institute/guardians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      toast.success("Guardian linked");
      setShowForm(false);
      setForm({ name: "", phone: "", email: "", relation: "Mother", password: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (linkId: string) => {
    if (!confirm("Remove this guardian link?")) return;
    try {
      const res = await fetch(`/api/institute/guardians?linkId=${linkId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Guardian removed");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary-700" /> Family guardians
        </p>
        <button
          type="button"
          className="btn-ghost text-xs py-1 px-2"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Link mother, father, or other guardians so each can access the parent portal for this student.
      </p>

      {loading ? (
        <div className="flex items-center text-xs text-gray-400 gap-2 py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : guardians.length === 0 ? (
        <p className="text-xs text-gray-400">No guardians linked yet.</p>
      ) : (
        <ul className="space-y-2">
          {guardians.map((g) => (
            <li
              key={g.linkId || g.parentId}
              className="flex items-start justify-between gap-2 rounded-lg bg-white border border-gray-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {g.name || "Unnamed"}
                  {g.isPrimary && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-primary-700 font-semibold">
                      Primary
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {g.relation}
                  {g.phone ? ` · ${g.phone}` : ""}
                  {g.email ? ` · ${g.email}` : ""}
                </p>
              </div>
              {g.linkId && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-600 p-1"
                  title="Remove link"
                  onClick={() => remove(g.linkId!)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="rounded-lg border border-primary-100 bg-white p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="form-input text-xs"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="form-input text-xs"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              className="form-input text-xs"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <select
              className="form-input text-xs"
              value={form.relation}
              onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
            >
              <option>Mother</option>
              <option>Father</option>
              <option>Guardian</option>
              <option>Grandparent</option>
              <option>Sibling</option>
            </select>
          </div>
          <input
            className="form-input text-xs w-full"
            placeholder="Temp password (optional)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <button
            type="button"
            className="btn-primary text-xs py-1.5 w-full"
            disabled={saving}
            onClick={addGuardian}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Link guardian"}
          </button>
        </div>
      )}
    </div>
  );
}
