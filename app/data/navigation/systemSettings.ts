import type { ModuleNavItem } from "../types";

export const systemSettingsNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/system-settings/dashboard", icon: "layout-grid" },
  { label: "General Settings", href: "/system-settings/settings", icon: "settings" },
  { label: "Audit Logs", href: "/system-settings/audit-logs", icon: "history" },
  { label: "Users & Roles", href: "/system-settings/users", icon: "users" },
  { label: "Integrations", href: "/system-settings/integrations", icon: "globe" },
];
