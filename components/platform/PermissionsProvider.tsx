"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  clearCachedPermissions,
  getCachedPermissions,
  setCachedPermissions,
  type PermissionLevel,
} from "@/lib/permissions";
import { platformService } from "@/services/platform";

type PermissionsContextValue = {
  permissions: Record<string, PermissionLevel | "admin">;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
  canRead: (moduleKey: string) => boolean;
  canWrite: (moduleKey: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState<Record<string, PermissionLevel | "admin">>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getCachedPermissions();
    if (cached) setPermissions(cached);
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!user) {
      setPermissions({});
      clearCachedPermissions();
      setLoading(false);
      return;
    }
    if (user.isSuperAdmin) {
      try {
        const modRows = await platformService.listModules();
        const all = Object.fromEntries(
          modRows.map((m) => [m.key, "admin" as const]),
        );
        setPermissions(all);
        setCachedPermissions(all);
      } catch {
        setPermissions({});
      }
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const perms = await platformService.myPermissions();
      setPermissions(perms);
      setCachedPermissions(perms);
    } catch {
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPermissions({});
      clearCachedPermissions();
      setLoading(false);
      return;
    }
    void refreshPermissions();
  }, [user, authLoading, refreshPermissions]);

  const canRead = useCallback(
    (moduleKey: string) => {
      if (user?.isSuperAdmin) return true;
      const level = permissions[moduleKey];
      return level === "read" || level === "write" || level === "admin";
    },
    [permissions, user?.isSuperAdmin],
  );

  const canWrite = useCallback(
    (moduleKey: string) => {
      if (user?.isSuperAdmin) return true;
      const level = permissions[moduleKey];
      return level === "write" || level === "admin";
    },
    [permissions, user?.isSuperAdmin],
  );

  const value = useMemo(
    () => ({
      permissions,
      loading,
      refreshPermissions,
      canRead,
      canWrite,
    }),
    [permissions, loading, refreshPermissions, canRead, canWrite],
  );

  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used within PermissionsProvider");
  return ctx;
}

export function usePermissionsOptional() {
  return useContext(PermissionsContext);
}
