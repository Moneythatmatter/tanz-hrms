import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/app/data/types";

const statusStyles: Record<BookingStatus, string> = {
  Confirmed: "bg-sky-50 text-sky-700 ring-sky-200",
  "Checked In": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Canceled: "bg-red-50 text-red-700 ring-red-200",
};

interface BadgeProps {
  status: BookingStatus;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        statusStyles[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
