"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ConciergeBell, LayoutGrid, LogOut, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: WorkspaceNavItem[] = [
  { href: "/human-resources/dashboard", label: "Human Resources", icon: LayoutGrid },
  { href: "/settings/users", label: "User management", icon: Users, adminOnly: true },
];

export function WorkspaceShell({
  children,
  title,
  description,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f7f8f7]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-black">
        <div className="border-b border-slate-800 px-4 py-4">
          <div className="flex items-start gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700/20 text-emerald-500">
              <ConciergeBell className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold uppercase tracking-tight text-white">
                Impact <span className="text-emerald-500">HRMS</span>
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Admin
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map((item) => {
            if (item.adminOnly && !isPlatformAdmin(user)) return null;
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/human-resources/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-950/70 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-emerald-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
              {user?.initials ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {(title || actions) && (
          <div className="border-b border-slate-200/80 bg-white px-6 py-6 sm:px-8">
            <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="mt-2 max-w-xl text-sm text-slate-500">{description}</p>
                )}
              </div>
              {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
            </div>
          </div>
        )}
        <div className="px-6 py-6 sm:px-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </div>
      </main>
    </div>
  );
}
