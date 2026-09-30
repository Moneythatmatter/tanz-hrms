"use client";

import type { NavItem, UserProfile } from "@/app/data/types";
import { Header } from "./Header";
import { TopNav } from "./TopNav";
import { MobileNavProvider } from "./MobileNavContext";

interface AppShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  user: UserProfile;
  moduleSidebar?: React.ReactNode;
  subNav?: React.ReactNode;
  hideTopNav?: boolean;
}

export function AppShell({
  children,
  navItems = [],
  user,
  moduleSidebar,
  subNav,
  hideTopNav = false,
}: AppShellProps) {
  return (
    <MobileNavProvider enabled={!!moduleSidebar}>
      <div className="flex h-screen min-w-0 overflow-hidden bg-[#f7f8f7]">
        {moduleSidebar}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header user={user} />
          {!hideTopNav && navItems.length > 0 && (
            <div className="shrink-0 border-b border-neutral-800 bg-black px-3 py-2 sm:px-4 lg:px-6">
              <TopNav items={navItems} />
            </div>
          )}
          {subNav && (
            <div className="shrink-0 border-b border-neutral-200 bg-white px-3 sm:px-4 lg:px-6">
              {subNav}
            </div>
          )}
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <main className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </MobileNavProvider>
  );
}
