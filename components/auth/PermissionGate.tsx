"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { usePermissions } from "@/components/platform/PermissionsProvider";
import {
  canAccessPath,
  firstAccessiblePath,
} from "@/lib/hr/route-permissions";

export function PermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, canRead } = usePermissions();

  const allowed = canAccessPath(pathname, canRead);
  const fallbackPath = firstAccessiblePath(canRead);

  useEffect(() => {
    if (loading || allowed) return;
    if (fallbackPath && fallbackPath !== pathname) {
      router.replace(fallbackPath);
    }
  }, [loading, allowed, fallbackPath, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading permissions…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <ShieldOff className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account does not have permission to view this page. Contact an administrator if
          you need access.
        </p>
        {fallbackPath ? (
          <Link
            href={fallbackPath}
            className="mt-6 inline-flex rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Go to your allowed page
          </Link>
        ) : (
          <p className="mt-6 text-sm font-medium text-amber-700">
            No HR modules are assigned to your account yet.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
