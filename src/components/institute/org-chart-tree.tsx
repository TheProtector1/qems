"use client";

import { cn, getInitials } from "@/lib/utils";
import type { ManagementTreeNode } from "@/lib/org-tree";
import { Mail, Phone, GraduationCap, ChevronDown } from "lucide-react";
import { useState } from "react";

function MemberCard({
  node,
  isRoot,
  onEdit,
  canEdit,
}: {
  node: ManagementTreeNode;
  isRoot?: boolean;
  onEdit?: (id: string) => void;
  canEdit?: boolean;
}) {
  const quals = node.qualifications
    ?.split("\n")
    .map((q) => q.trim())
    .filter(Boolean)
    .slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => canEdit && onEdit?.(node.id)}
      className={cn(
        "group relative w-[220px] sm:w-[240px] rounded-2xl border bg-white text-left shadow-sm transition-all",
        isRoot ? "border-primary-200 ring-2 ring-primary-100" : "border-gray-200 hover:border-primary-200 hover:shadow-md",
        canEdit && "cursor-pointer"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {node.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={node.photo}
              alt={node.fullName}
              className="h-12 w-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100"
            />
          ) : (
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0",
                isRoot ? "bg-gradient-to-br from-primary-600 to-primary-800" : "bg-gradient-to-br from-slate-500 to-slate-700"
              )}
            >
              {getInitials(node.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{node.fullName}</p>
            <p className="text-xs font-medium text-primary-700 mt-0.5 truncate">{node.roleTitle}</p>
            {node.department && (
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1 truncate">{node.department}</p>
            )}
          </div>
        </div>

        {quals && quals.length > 0 && (
          <div className="mt-3 flex items-start gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{quals.join(" · ")}</p>
          </div>
        )}

        {(node.email || node.phone) && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            {node.email && (
              <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" /> {node.email}
              </p>
            )}
            {node.phone && (
              <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                <Phone className="h-3 w-3 flex-shrink-0" /> {node.phone}
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function TreeBranch({
  node,
  onEdit,
  canEdit,
}: {
  node: ManagementTreeNode;
  onEdit?: (id: string) => void;
  canEdit?: boolean;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <li className="flex flex-col items-center">
      <MemberCard node={node} onEdit={onEdit} canEdit={canEdit} isRoot={!node.reportsToId} />

      {hasChildren && (
        <>
          <div className="h-6 w-px bg-gray-300" />
          <div className="relative flex justify-center">
            <div className="absolute top-0 h-px bg-gray-300" style={{ left: "12%", right: "12%" }} />
            <ul className="flex flex-wrap justify-center gap-x-8 gap-y-10 pt-6">
              {node.children.map((child) => (
                <li key={child.id} className="flex flex-col items-center relative">
                  <div className="absolute -top-6 left-1/2 h-6 w-px bg-gray-300 -translate-x-1/2" />
                  <TreeBranch node={child} onEdit={onEdit} canEdit={canEdit} />
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </li>
  );
}

export function OrgChartTree({
  tree,
  onEdit,
  canEdit = false,
}: {
  tree: ManagementTreeNode[];
  onEdit?: (id: string) => void;
  canEdit?: boolean;
}) {
  const [expandedList, setExpandedList] = useState(true);

  if (tree.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
        <p className="text-sm font-medium text-gray-600">No leadership members added yet</p>
        <p className="text-xs text-gray-400 mt-1">Add your director, principal, and management team to build the org chart.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Reporting structure · {canEdit ? "Click a card to edit" : "Read-only view"}
        </p>
        <button
          type="button"
          onClick={() => setExpandedList((v) => !v)}
          className="text-xs font-medium text-primary-700 inline-flex items-center gap-1"
        >
          {expandedList ? "Top level only" : "Full org tree"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expandedList && "rotate-180")} />
        </button>
      </div>

      {expandedList ? (
        <div className="overflow-x-auto pb-6">
          <ul className="flex flex-wrap justify-center gap-x-12 gap-y-10 min-w-max px-4 mx-auto">
            {tree.map((root) => (
              <TreeBranch key={root.id} node={root} onEdit={onEdit} canEdit={canEdit} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tree.map((root) => (
            <MemberCard key={root.id} node={root} isRoot onEdit={onEdit} canEdit={canEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
