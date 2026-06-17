"use client";

import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

const avatarColors = [
  "from-emerald-400 to-green-600",
  "from-blue-400 to-indigo-600",
  "from-violet-400 to-purple-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-cyan-600",
];

type StudentAvatarProps = {
  name: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | string;
  photo?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  rounded?: "xl" | "2xl" | "full";
};

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
  xl: "h-24 w-24 text-3xl",
};

const roundedMap = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export function StudentAvatar({
  name,
  gender = "MALE",
  photo,
  size = "md",
  className,
  rounded = "2xl",
}: StudentAvatarProps) {
  const colorIdx = name.charCodeAt(0) % avatarColors.length;
  const avatarGrad =
    gender === "FEMALE" ? "from-pink-400 to-rose-600" : avatarColors[colorIdx];

  if (photo) {
    const isRemote = photo.startsWith("http://") || photo.startsWith("https://");

    return (
      <div
        className={cn(
          "relative overflow-hidden flex-shrink-0 shadow-sm ring-2 ring-white",
          sizeMap[size],
          roundedMap[rounded],
          className
        )}
      >
        {isRemote ? (
          <Image src={photo} alt={name} fill className="object-cover" sizes="96px" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm bg-gradient-to-br",
        sizeMap[size],
        roundedMap[rounded],
        avatarGrad,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
