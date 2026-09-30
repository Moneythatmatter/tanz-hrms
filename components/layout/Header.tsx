"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, MessageSquare, Search, X } from "lucide-react";
import type { UserProfile } from "@/app/data/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./MobileNavContext";

interface HeaderProps {
  user: UserProfile;
}

export function Header({ user: fallbackUser }: HeaderProps) {
  const mobileNav = useMobileNav();
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  const user = authUser
    ? {
      name: authUser.name,
      role: authUser.role,
      initials: authUser.initials,
    }
    : fallbackUser;

  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="border-b border-neutral-800 bg-black px-3 py-3 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {mobileNav?.enabled && (
            <button
              type="button"
              onClick={mobileNav.open}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white uppercase">
              Impact <span className="text-emerald-500">HRMS</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              searchOpen
                ? "bg-emerald-700 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white",
            )}
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Messages"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="ml-0.5 flex items-center gap-2 border-l border-neutral-700 pl-2 sm:gap-2.5 sm:pl-3">
            <Avatar initials={user.initials} size="sm" />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-neutral-400">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search employee, shift, department..."
            className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-3 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      )}
    </header>
  );
}
