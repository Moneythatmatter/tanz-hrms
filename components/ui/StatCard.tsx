import { TrendingDown, TrendingUp } from "lucide-react";
import type { SummaryStat } from "@/app/data/types";
import { Card } from "./Card";

interface StatCardProps {
  stat: SummaryStat;
}

export function StatCard({ stat }: StatCardProps) {
  const isUp = stat.trend === "up";

  return (
    <Card className="h-full min-w-0 p-3 sm:p-5">
      <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
        {stat.title}
      </p>
      <div className="mt-1.5 flex flex-col gap-1 sm:mt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
        <p className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-2xl">
          {stat.value}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium sm:text-xs ${
            isUp ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" />
          )}
          {stat.change}
        </span>
      </div>
    </Card>
  );
}
