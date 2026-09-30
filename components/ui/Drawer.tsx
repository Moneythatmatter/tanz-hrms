"use client";

import React, { useEffect } from "react";
import { Drawer as ResizableDrawer } from "@/components/frontoffice/ui/Drawer";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Allow drag-resize from the left edge. Default true. */
  resizable?: boolean;
}

/** Shared resizable side drawer — wraps the Front Office drawer for consistent UX app-wide. */
export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "md",
  resizable = true,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const customHeader = icon ? (
    <div className="flex min-w-0 items-center gap-2">
      {icon}
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
    </div>
  ) : undefined;

  return (
    <ResizableDrawer
      open={isOpen}
      onClose={onClose}
      title={title}
      description={subtitle}
      customHeader={customHeader}
      footer={footer}
      width={maxWidth}
      resizable={resizable}
    >
      <div className="space-y-4">{children}</div>
    </ResizableDrawer>
  );
}
