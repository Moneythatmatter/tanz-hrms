"use client";

import { useMemo } from "react";
import { currentUser } from "@/app/data";
import { humanResourcesNavItems } from "@/app/data/navigation/humanResources";
import { AuthGate } from "@/components/auth/AuthGate";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";
import { usePermissions } from "@/components/platform/PermissionsProvider";
import { filterNavItemsByPermissions } from "@/lib/hr/route-permissions";
import { HumanResourcesSubNav } from "./HumanResourcesSubNav";

export function HumanResourcesShell({ children }: { children: React.ReactNode }) {
  const { canRead, loading } = usePermissions();

  const sidebarItems = useMemo(() => {
    if (loading) return humanResourcesNavItems;
    return filterNavItemsByPermissions(humanResourcesNavItems, canRead);
  }, [canRead, loading]);

  return (
    <AuthGate>
      <AppShell
        hideTopNav
        user={currentUser}
        subNav={<HumanResourcesSubNav />}
        moduleSidebar={
          <ModuleSidebar
            title="Human Resource"
            subtitle="HR Management System"
            items={sidebarItems}
          />
        }
      >
        <PermissionGate>{children}</PermissionGate>
      </AppShell>
    </AuthGate>
  );
}
