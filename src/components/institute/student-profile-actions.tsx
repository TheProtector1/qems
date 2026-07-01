"use client";

import Link from "next/link";
import { MessageSquare, Pencil } from "lucide-react";

export function StudentProfileActions({
  studentId,
  parentEmail,
  backHref,
}: {
  studentId: string;
  parentEmail?: string | null;
  backHref: string;
}) {
  return (
    <div className="flex flex-wrap justify-center lg:justify-end gap-2">
      {parentEmail ? (
        <a href={`mailto:${parentEmail}`} className="btn-ghost text-sm py-2 px-3">
          <MessageSquare className="h-4 w-4" /> Message parent
        </a>
      ) : (
        <Link href="/institute/communication" className="btn-ghost text-sm py-2 px-3">
          <MessageSquare className="h-4 w-4" /> Message parent
        </Link>
      )}
      <Link
        href={`${backHref}?edit=${studentId}`}
        className="btn-primary text-sm py-2 px-3"
      >
        <Pencil className="h-4 w-4" /> Edit profile
      </Link>
    </div>
  );
}
