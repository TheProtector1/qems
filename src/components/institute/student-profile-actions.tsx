"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

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
    <div className="flex gap-2 pb-1">
      {parentEmail ? (
        <a href={`mailto:${parentEmail}`} className="btn-ghost text-sm py-2">
          <MessageSquare className="h-4 w-4" /> Message Parent
        </a>
      ) : (
        <Link href="/institute/communication" className="btn-ghost text-sm py-2">
          <MessageSquare className="h-4 w-4" /> Message Parent
        </Link>
      )}
      <Link
        href={`${backHref}?edit=${studentId}`}
        className="btn-primary text-sm py-2"
      >
        Edit Profile
      </Link>
    </div>
  );
}
