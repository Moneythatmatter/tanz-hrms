const AUTH_LOCAL_KEYS = new Set([
  "pms_session",
  "pms_token",
  "hrms_permissions",
  "pms-side-drawer-width",
]);

const LEGACY_LOCAL_KEYS = [
  "hk_rooms",
  "hk_publicAreas",
  "hk_inventory",
  "hk_laundry",
  "hk_damages",
  "hk_requisitions",
  "hk_history",
  "hk_luggage",
  "hk_requests",
  "hk_maintenance",
  "hk_lostfound",
  "hk_staff",
  "hk_checklists",
  "hk_shifts",
  "hk_role",
  "pms_business_date",
  "pms_luggage_extra_info",
  "pms_laundry_extra_info",
];

const LEGACY_SESSION_KEYS = ["pms-day-closing-v1", "pms-night-audit-v1"];

/** Remove cached app data; keep only auth session + token in localStorage. */
export function clearNonAuthStorage() {
  if (typeof window === "undefined") return;

  for (const key of LEGACY_LOCAL_KEYS) {
    localStorage.removeItem(key);
  }

  for (const key of LEGACY_SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }

  // Drop any other stray keys except auth
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key && !AUTH_LOCAL_KEYS.has(key)) {
      localStorage.removeItem(key);
    }
  }
}
