"use client";

import { cn } from "@/lib/utils";
import { getListTableInitials } from "./utils";

export interface ListTablePersonCellProps {
  name: string;
  subtitle?: string;
  meta?: string;
  initials?: string;
  photoUrl?: string;
  className?: string;
}

export function ListTablePersonCell({
  name,
  subtitle,
  meta,
  initials,
  photoUrl,
  className,
}: ListTablePersonCellProps) {
  const avatarLabel = initials ?? getListTableInitials(name);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white transition-colors group-hover:from-emerald-600 group-hover:to-emerald-800">
          {avatarLabel}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{name}</p>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        {meta ? <p className="text-[11px] text-slate-400">{meta}</p> : null}
      </div>
    </div>
  );
}
