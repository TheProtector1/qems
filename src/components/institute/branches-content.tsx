"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Plus, UserCheck, Mail, Phone, Users, Loader2 } from "lucide-react";

type Branch = {
  id: string;
  name: string;
  manager: string;
  studentsCount: number;
  teachersCount: number;
  phone: string;
  email: string;
  status: string;
};

export function BranchesContent() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institute/branches");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setBranches(data.branches || []);
    } catch (err) {
      console.error(err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading branches...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-heading font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary-700" /> Campus Branches
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage details and staff allocation for different branches</p>
        </div>
        <Link href="/institute/settings" className="btn-primary text-xs py-2">
          <Plus className="h-4 w-4" /> Add Branch
        </Link>
      </div>

      {branches.length === 0 ? (
        <div className="dash-card p-12 text-center text-gray-400">
          <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No branches configured yet.</p>
          <Link href="/institute/settings" className="text-primary-700 text-sm font-semibold mt-2 inline-block">
            Add your first branch →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {branches.map((b) => (
            <div key={b.id} className="dash-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-gray-900">{b.name}</h3>
                  <span className="pill pill-success text-[10px] py-0.5">{b.status}</span>
                </div>
                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-gray-400" />
                    <span>Manager: <strong>{b.manager}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>Students: <strong>{b.studentsCount}</strong> • Teachers: <strong>{b.teachersCount}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{b.email}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 border-t border-gray-100 pt-4 mt-2">
                <Link href="/institute/settings" className="btn-ghost flex-1 text-xs py-2 text-center">Edit Details</Link>
                <Link href="/institute/analytics" className="btn-primary flex-1 text-xs py-2 text-center">View Analytics</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
