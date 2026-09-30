"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "info";

const variants: Record<
  AlertVariant,
  { icon: typeof CheckCircle2; className: string }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-200 bg-red-50 text-red-800",
  },
  info: {
    icon: Info,
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
};

interface AlertBannerProps {
  variant: AlertVariant;
  message: string;
  onDismiss?: () => void;
  /** Auto-hide after ms when onDismiss is provided. Default 3s for success, 4s for info. Set 0 to disable. */
  autoDismissMs?: number;
  className?: string;
}

export function AlertBanner({
  variant,
  message,
  onDismiss,
  autoDismissMs,
  className,
}: AlertBannerProps) {
  const { icon: Icon, className: variantClass } = variants[variant];
  const timeout =
    autoDismissMs ?? (variant === "success" ? 3000 : variant === "info" ? 4000 : 0);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!onDismissRef.current || !timeout) return;
    const id = window.setTimeout(() => onDismissRef.current?.(), timeout);
    return () => window.clearTimeout(id);
  }, [message, timeout]);

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        variantClass,
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 font-medium">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
