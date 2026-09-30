"use client";

import type { ReactNode, MouseEvent } from "react";
import { cn } from "@/lib/utils";

export function ListTable({
  children,
  className,
  minWidthClassName = "min-w-[860px]",
}: {
  children: ReactNode;
  className?: string;
  minWidthClassName?: string;
}) {
  return (
    <div className={cn("hidden overflow-x-auto md:block", className)}>
      <table className={cn("w-full text-left text-sm", minWidthClassName)}>
        {children}
      </table>
    </div>
  );
}

export function ListTableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-slate-100 bg-slate-50/80">{children}</tr>
    </thead>
  );
}

export function ListTableHeaderCell({
  children,
  className,
  align = "left",
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ListTableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-50">{children}</tbody>;
}

export function ListTableRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "group cursor-pointer transition-colors hover:bg-emerald-50/30",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function ListTableCell({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLTableCellElement>) => void;
}) {
  return (
    <td className={cn("px-4 py-3.5", className)} onClick={onClick}>
      {children}
    </td>
  );
}

export function ListTableCheckboxHeader({
  checked,
  onChange,
  ariaLabel = "Select all",
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
}) {
  return (
    <ListTableHeaderCell className="w-10">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-300"
        aria-label={ariaLabel}
      />
    </ListTableHeaderCell>
  );
}

export function ListTableCheckboxCell({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <ListTableCell onClick={(event) => event.stopPropagation()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="rounded border-slate-300"
        aria-label={ariaLabel}
      />
    </ListTableCell>
  );
}

export function ListTableFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-[11px] text-slate-400">
      {children}
    </div>
  );
}

export function ListTableEmptyState({
  message,
  colSpan = 6,
}: {
  message: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {message}
      </td>
    </tr>
  );
}
