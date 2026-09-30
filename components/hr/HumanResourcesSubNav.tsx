"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  CreditCard,
  LayoutGrid,
  Repeat,
  Users,
} from "lucide-react";
import { humanResourcesQuickNavItems } from "@/app/data/navigation/humanResourcesQuickNav";
import { usePermissions } from "@/components/platform/PermissionsProvider";
import { canAccessPath } from "@/lib/hr/route-permissions";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-grid": LayoutGrid,
  users: Users,
  clock: Clock,
  repeat: Repeat,
  calendar: Calendar,
  "credit-card": CreditCard,
};

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;

  if (href === "/human-resources/dashboard") {
    return pathname === "/human-resources" || pathname === "/human-resources/dashboard";
  }

  if (href === "/human-resources/employees/list") {
    return (
      pathname === "/human-resources/employees" ||
      pathname.startsWith("/human-resources/employees/")
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HumanResourcesSubNav() {
  const pathname = usePathname();
  const { canRead, loading } = usePermissions();

  const items = loading
    ? humanResourcesQuickNavItems
    : humanResourcesQuickNavItems.filter((item) => canAccessPath(item.href, canRead));

  return (
    <nav
      aria-label="Human resources quick navigation"
      className="flex gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
    >
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = isNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
              isActive
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
