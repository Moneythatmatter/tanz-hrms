"use client";

import { AuthProvider } from "./AuthProvider";
import { PermissionsProvider } from "@/components/platform/PermissionsProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PermissionsProvider>{children}</PermissionsProvider>
    </AuthProvider>
  );
}
