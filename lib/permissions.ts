export type PermissionLevel = "read" | "write" | "admin";

export const PERMISSIONS_CACHE_KEY = "hrms_permissions";

export function getCachedPermissions(): Record<string, PermissionLevel | "admin"> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERMISSIONS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PermissionLevel | "admin">) : null;
  } catch {
    return null;
  }
}

export function setCachedPermissions(perms: Record<string, PermissionLevel | "admin"> | null) {
  if (typeof window === "undefined") return;
  if (perms) {
    localStorage.setItem(PERMISSIONS_CACHE_KEY, JSON.stringify(perms));
  } else {
    localStorage.removeItem(PERMISSIONS_CACHE_KEY);
  }
}

export function clearCachedPermissions() {
  setCachedPermissions(null);
}
