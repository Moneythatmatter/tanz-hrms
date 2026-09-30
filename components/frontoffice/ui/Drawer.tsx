"use client";

import { GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResizablePanelWidth } from "@/lib/use-resizable-panel-width";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  customHeader?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "responsive" | string;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
  className?: string;
  /** Allow drag-resize from the left edge. Default true. */
  resizable?: boolean;
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  customHeader,
  children,
  footer,
  width = "md",
  fullScreen = false,
  onToggleFullScreen,
  className,
  resizable = true,
}: DrawerProps) {
  const widthKey = fullScreen ? undefined : width;
  const { panelWidth, onResizeStart, isResizing, resizable: canResize } =
    useResizablePanelWidth(open, widthKey, { enabled: resizable && !fullScreen });

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />


      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        suppressHydrationWarning
        style={fullScreen || !canResize ? undefined : { width: panelWidth, maxWidth: "60vw" }}
        className={cn(
          "fixed z-50 flex flex-col bg-white shadow-2xl",
          !isResizing && "transition-all duration-300 ease-out",
          fullScreen
            ? "inset-0 border-0"
            : cn(
                "inset-y-0 right-0 border-l border-slate-200",
                !canResize && width === "sm" && "w-full max-w-sm",
                !canResize && width === "md" && "w-full max-w-md",
                !canResize && width === "lg" && "w-full max-w-lg",
                !canResize && width === "xl" && "w-full max-w-2xl",
                !canResize && width === "2xl" && "w-full max-w-4xl",
                !canResize && width === "3xl" && "w-full max-w-6xl",
                !canResize &&
                  width === "responsive" &&
                  "w-full md:w-[85vw] lg:w-[70vw] xl:w-[65vw]",
                !canResize &&
                  typeof width === "string" &&
                  !["sm", "md", "lg", "xl", "xl", "2xl", "3xl", "responsive"].includes(width) &&
                  width,
              ),
          open ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        {canResize && !fullScreen && (
          <button
            type="button"
            aria-label="Resize drawer"
            onMouseDown={onResizeStart}
            className={cn(
              "group absolute -left-2 top-0 z-30 flex h-full w-4 cursor-col-resize items-center justify-center border-0 bg-transparent p-0",
              isResizing && "bg-emerald-500/10",
            )}
          >
            <span
              className={cn(
                "flex h-14 w-1.5 items-center justify-center rounded-full bg-slate-200 transition-colors",
                "group-hover:bg-emerald-400 group-active:bg-emerald-500",
                isResizing && "bg-emerald-500",
              )}
            >
              <GripVertical className="h-3 w-3 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        )}

        <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            {customHeader ? (
              customHeader
            ) : (
              <>
                <h2 id="drawer-title" className="truncate text-lg font-bold text-slate-900">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label={fullScreen ? "Exit full screen" : "Full screen"}
                title={fullScreen ? "Exit full screen" : "Full screen"}
              >
                {fullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div className={cn("flex-1 overflow-y-auto px-5 py-5", fullScreen && "bg-slate-50")}>
          {children}
        </div>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
