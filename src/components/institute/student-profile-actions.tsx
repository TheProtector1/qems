"use client";

import Link from "next/link";
import { MessageSquare, Pencil } from "lucide-react";
import { ShareToChatButton } from "@/components/common/share-to-chat";
import { buildStudentProgressShare } from "@/lib/share-templates";
import { getInitials } from "@/lib/utils";

export function StudentProfileActions({
  studentId,
  studentName,
  studentCode,
  program,
  progress,
  teacherName,
  attendanceRate,
  parentEmail,
  parentUserId,
  parentName,
  backHref,
}: {
  studentId: string;
  studentName: string;
  studentCode?: string;
  program?: string;
  progress?: string;
  teacherName?: string;
  attendanceRate?: string | number;
  parentEmail?: string | null;
  parentUserId?: string | null;
  parentName?: string | null;
  backHref: string;
}) {
  const draft = buildStudentProgressShare({
    studentName,
    studentCode,
    program,
    progress,
    teacher: teacherName,
    attendanceRate,
  });

  const preferred = parentUserId
    ? [
        {
          id: parentUserId,
          name: parentName || "Parent",
          role: "Parent",
          avatar: getInitials(parentName || "Parent"),
        },
      ]
    : undefined;

  return (
    <div className="flex flex-wrap justify-center lg:justify-end gap-2">
      <ShareToChatButton
        draft={draft}
        studentId={studentId}
        preferredRecipients={preferred}
        label="Share update"
        variant="ghost"
      />
      {parentEmail ? (
        <a href={`mailto:${parentEmail}`} className="btn-ghost text-sm py-2 px-3">
          <MessageSquare className="h-4 w-4" /> Email parent
        </a>
      ) : (
        <Link href="/institute/communication" className="btn-ghost text-sm py-2 px-3">
          <MessageSquare className="h-4 w-4" /> Open chat
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
