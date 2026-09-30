import { cn } from "@/lib/utils";
import {
  moduleLiveStatusMeta,
  moduleStatusClass,
  type ModuleStatusStyle,
} from "./module-types";

export function ModuleStatusPill({
  status,
  style = "pill",
  className,
  statusMap,
}: {
  status: string;
  style?: ModuleStatusStyle;
  className?: string;
  statusMap?: Record<string, string>;
}) {
  if (style === "live") {
    const meta = moduleLiveStatusMeta(status);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
          meta.className,
          className,
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
        {status}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        moduleStatusClass(status, statusMap),
        className,
      )}
    >
      {status}
    </span>
  );
}
