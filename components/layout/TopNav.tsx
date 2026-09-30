"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ConciergeBell,
  Utensils,
  Sparkles,
  Package,
  Users,
  Calculator,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { NavItem } from "@/app/data/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-dashboard": LayoutDashboard,
  "concierge-bell": ConciergeBell,
  utensils: Utensils,
  sparkles: Sparkles,
  package: Package,
  users: Users,
  calculator: Calculator,
  "trending-up": TrendingUp,
  wrench: Wrench,
};

interface TopNavProps {
  items: NavItem[];
}

export function TopNav({ items }: TopNavProps) {
  const pathname = usePathname();

  return (
    <nav className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-0.5 scrollbar-none sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
      {items.map((item) => {
        const Icon = iconMap[item.icon] ?? LayoutDashboard;
        const isActive =
          pathname === item.href ||
          (item.href !== "#" && item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm",
              isActive
                ? "bg-emerald-700 text-white"
                : "text-neutral-300 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden truncate sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
