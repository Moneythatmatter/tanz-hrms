"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user) return;
    const next = pathname && pathname !== "/" ? pathname : "/human-resources/dashboard";
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
