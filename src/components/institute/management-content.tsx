"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus, Edit2, Trash2, X, Loader2, Network, List, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OrgChartTree } from "@/components/institute/org-chart-tree";
import {
  MANAGEMENT_DEPARTMENTS,
  MANAGEMENT_ROLE_SUGGESTIONS,
  type ManagementMemberFlat,
  type ManagementTreeNode,
} from "@/lib/org-tree";
import { compressImageFile } from "@/lib/image";

const emptyForm = () => ({
  fullName: "",
  roleTitle: "",
  email: "",
  phone: "",
  department: "",
  qualifications: "",
  bio: "",
  photo: "" as string | null,
  joinDate: "",
  reportsToId: "",
  sortOrder: "0",
});

export function ManagementContent({ canEdit = true }: { canEdit?: boolean }) {
  const [members, setMembers] = useState<ManagementMemberFlat[]>([]);
  const [tree, setTree] = useState<ManagementTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"chart" | "list">("chart");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/management");
      if (!res.ok) throw new Error("Failed to load management team");
      const data = await res.json();
      setMembers(data.members || []);
      setTree(data.tree || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const managerOptions = useMemo(
    () => members.filter((m) => m.id !== editingId),
    [members, editingId]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    setEditingId(id);
    setForm({
      fullName: member.fullName,
      roleTitle: member.roleTitle,
      email: member.email || "",
      phone: member.phone || "",
      department: member.department || "",
      qualifications: member.qualifications || "",
      bio: member.bio || "",
      photo: member.photo,
      joinDate: member.joinDate || "",
      reportsToId: member.reportsToId || "",
      sortOrder: String(member.sortOrder),
    });
    setError(null);
    setModalOpen(true);
  };

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setForm((f) => ({ ...f, photo: compressed }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.roleTitle.trim()) {
      setError("Name and role title are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        reportsToId: form.reportsToId || null,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const res = await fetch(
        editingId ? `/api/institute/management/${editingId}` : "/api/institute/management",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this leadership member from the org chart?")) return;
    const res = await fetch(`/api/institute/management/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Delete failed");
      return;
    }
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading management structure…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Network className="h-6 w-6 text-primary-700" />
            Institute Leadership
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Define your management team, qualifications, and reporting hierarchy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-gray-200 p-1 bg-white">
            <button
              type="button"
              onClick={() => setView("chart")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5",
                view === "chart" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Network className="h-3.5 w-3.5" /> Org chart
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5",
                view === "list" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <List className="h-3.5 w-3.5" /> Directory
            </button>
          </div>
          {canEdit && (
            <button type="button" onClick={openCreate} className="btn-primary text-sm py-2">
              <Plus className="h-4 w-4" /> Add member
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Leadership", value: members.length, icon: Users },
          { label: "Departments", value: new Set(members.map((m) => m.department).filter(Boolean)).size, icon: Network },
          { label: "Top level", value: members.filter((m) => !m.reportsToId).length, icon: Users },
          { label: "With reports", value: members.filter((m) => m.reportsToId).length, icon: Users },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="dash-card p-4 bg-white flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dash-card bg-white p-5 sm:p-6">
        {view === "chart" ? (
          <OrgChartTree tree={tree} onEdit={openEdit} canEdit={canEdit} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Reports to</th>
                  <th>Qualifications</th>
                  {canEdit && <th />}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="text-center text-sm text-gray-500 py-10">
                      No members yet. Add your first leadership role to get started.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => {
                    const manager = members.find((x) => x.id === m.reportsToId);
                    return (
                      <tr key={m.id}>
                        <td className="font-medium text-gray-900">{m.fullName}</td>
                        <td>{m.roleTitle}</td>
                        <td className="text-gray-600">{m.department || "—"}</td>
                        <td className="text-gray-600">{manager?.fullName || "—"}</td>
                        <td className="text-xs text-gray-500 max-w-[200px] truncate">{m.qualifications || "—"}</td>
                        {canEdit && (
                          <td>
                            <div className="flex gap-1 justify-end">
                              <button type="button" onClick={() => openEdit(m.id)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => handleDelete(m.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-display font-bold text-gray-900">
                {editingId ? "Edit leadership member" : "Add leadership member"}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">Full name *</span>
                  <input className="input mt-1 w-full" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Role title *</span>
                  <input className="input mt-1 w-full" list="role-suggestions" value={form.roleTitle} onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))} />
                  <datalist id="role-suggestions">
                    {MANAGEMENT_ROLE_SUGGESTIONS.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Department</span>
                  <select className="input mt-1 w-full" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}>
                    <option value="">Select department</option>
                    {MANAGEMENT_DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Email</span>
                  <input type="email" className="input mt-1 w-full" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Phone</span>
                  <input className="input mt-1 w-full" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Reports to</span>
                  <select className="input mt-1 w-full" value={form.reportsToId} onChange={(e) => setForm((f) => ({ ...f, reportsToId: e.target.value }))}>
                    <option value="">Top level (no manager)</option>
                    {managerOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.fullName} — {m.roleTitle}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">Join date</span>
                  <input type="date" className="input mt-1 w-full" value={form.joinDate} onChange={(e) => setForm((f) => ({ ...f, joinDate: e.target.value }))} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">Qualifications</span>
                  <textarea className="input mt-1 w-full min-h-[72px]" placeholder="One per line, e.g. Hafiz-e-Quran, Shahadat-ul-Almiya" value={form.qualifications} onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">Bio / responsibilities</span>
                  <textarea className="input mt-1 w-full min-h-[72px]" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">Photo</span>
                  <input type="file" accept="image/*" className="mt-1 text-sm" onChange={(e) => handlePhoto(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost text-sm py-2">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
