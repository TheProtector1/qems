"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";

export function EditInstituteContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    city: "",
    country: "PK",
    address: "",
    isActive: true,
    isApproved: true,
  });

  useEffect(() => {
    fetch(`/api/admin/institutes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const inst = data.institute;
        if (inst) {
          setForm({
            name: inst.name || "",
            slug: inst.slug || "",
            email: inst.email || "",
            phone: inst.phone || "",
            city: inst.city || "",
            country: inst.country || "PK",
            address: inst.address || "",
            isActive: inst.isActive,
            isApproved: inst.isApproved,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/institutes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/admin/institutes");
      else alert((await res.json()).error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this institute permanently?")) return;
    const res = await fetch(`/api/admin/institutes/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/institutes");
    else alert((await res.json()).error || "Delete failed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary-700" /> Edit Institute
        </h2>
        <Link href="/admin/institutes" className="text-sm text-primary-700 hover:underline">← Back</Link>
      </div>

      <div className="dash-card p-6 space-y-4">
        {(["name", "slug", "email", "phone", "city", "country", "address"] as const).map((field) => (
          <div key={field}>
            <label className="text-xs font-medium text-gray-600 capitalize">{field}</label>
            <input
              className="form-input mt-1"
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isApproved} onChange={(e) => setForm({ ...form, isApproved: e.target.checked })} />
            Approved
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={save} disabled={saving} className="btn-primary text-sm py-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
          <button type="button" onClick={remove} className="btn-ghost text-sm py-2 text-red-600">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
