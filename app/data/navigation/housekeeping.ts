import type { ModuleNavItem } from "../types";

export const housekeepingNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/housekeeping/dashboard", icon: "layout-grid" },
  {
    label: "Operations",
    href: "/housekeeping/operations",
    icon: "sparkles",
    children: [
      { label: "Room Status", href: "/housekeeping/operations/rooms", icon: "bed" },
      { label: "Cleaning Tasks", href: "/housekeeping/operations/room-cleaning", icon: "sparkles" },
      { label: "Public Area", href: "/housekeeping/operations/public-cleaning", icon: "trees" },
      { label: "Cleaning Inspection", href: "/housekeeping/operations/inspection", icon: "user-check" },
      { label: "Guest Requests", href: "/housekeeping/housekeeping-requests", icon: "bell" },
      { label: "Maintenance", href: "/housekeeping/maintenance-requests", icon: "wrench" },
      { label: "Laundry Flow", href: "/housekeeping/operations/laundry", icon: "arrow-right-left" },
      { label: "Luggage", href: "/housekeeping/luggage-management", icon: "luggage" },
      { label: "Lost & Found", href: "/housekeeping/lost-and-found", icon: "package-search" },
      { label: "Deep Cleaning", href: "/housekeeping/operations/deep-cleaning", icon: "calendar-clock" },
      { label: "Damage Reports", href: "/housekeeping/operations/damage-reports", icon: "alert-triangle" },
      { label: "Requisitions", href: "/housekeeping/operations/requisition", icon: "plus-circle" },
    ],
  },
  {
    label: "Masters",
    href: "/housekeeping/masters",
    icon: "bed",
    children: [
      { label: "Room Master", href: "/housekeeping/masters/rooms", icon: "bed" },
      { label: "Public Areas", href: "/housekeeping/masters/public-areas", icon: "trees" },
      { label: "Cleaning Checklists", href: "/housekeeping/masters/checklists", icon: "clipboard-list" },
      { label: "Staff & Shifts", href: "/housekeeping/masters/staff", icon: "users" },
    ],
  },
  {
    label: "Inventory",
    href: "/housekeeping/inventory",
    icon: "tag",
  },
  {
    label: "Reports",
    href: "/housekeeping/reports",
    icon: "bar-chart",
  },
  {
    label: "Settings",
    href: "/housekeeping/settings",
    icon: "settings",
  },
];

