import type { ModuleNavItem } from "../types";

export const salesMarketingNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/sales-marketing/dashboard", icon: "layout-grid" },
  {
    label: "Marketing",
    href: "/sales-marketing/marketing",
    icon: "megaphone",
    children: [
      { label: "Campaigns", href: "/sales-marketing/marketing/campaigns", icon: "target" },
      { label: "Promos & Discounts", href: "/sales-marketing/marketing/promo-codes", icon: "ticket" },
      { label: "OTA & Channel Performance", href: "/sales-marketing/marketing/ota-performance", icon: "globe" },
      { label: "Guest Retention & Loyalty", href: "/sales-marketing/marketing/loyalty", icon: "crown" },
    ],
  },
  {
    label: "Lead & Sales Management",
    href: "/sales-marketing/crm",
    icon: "users",
    children: [
      { label: "Leads & Inquiries", href: "/sales-marketing/crm/leads", icon: "user-plus" },
      { label: "Deals & Pipeline", href: "/sales-marketing/crm/pipeline", icon: "git-commit" },
      { label: "Activities", href: "/sales-marketing/crm/activities-calls", icon: "calendar-check" },
      { label: "Contacts", href: "/sales-marketing/crm/accounts-contacts", icon: "building-2" },
    ],
  },
  {
    label: "Banquets & Events",
    href: "/sales-marketing/banquets",
    icon: "sparkles",
    children: [
      { label: "Event Bookings", href: "/sales-marketing/banquets/bookings-enquiries", icon: "calendar-days" },
      { label: "Function Sheets (BEO)", href: "/sales-marketing/banquets/beo", icon: "file-spreadsheet" },
      { label: "Venue Availability", href: "/sales-marketing/banquets/venue-availability", icon: "calendar-clock" },
    ],
  },
  {
    label: "Masters",
    href: "/sales-marketing/masters",
    icon: "database",
    children: [
      { label: "Venues & Spaces", href: "/sales-marketing/masters/venues-spaces", icon: "landmark" },
      { label: "Rates & Commissions", href: "/sales-marketing/masters/rates-commissions", icon: "receipt" },
      { label: "Lead Sources", href: "/sales-marketing/masters/lead-sources", icon: "share-2" },
      { label: "Activity Types", href: "/sales-marketing/masters/activity-types", icon: "check-square" },
      { label: "Deal Stages", href: "/sales-marketing/masters/deal-stages", icon: "git-commit" },
      { label: "Booking Categories", href: "/sales-marketing/masters/booking-categories", icon: "tag" },
      { label: "Contact Types", href: "/sales-marketing/masters/contact-types", icon: "users" },
    ],
  },
  { label: "Reports & Insights", href: "/sales-marketing/reports-analytics", icon: "bar-chart-3" },
  {
    label: "Settings",
    href: "/sales-marketing/settings",
    icon: "settings",
    children: [
      { label: "Loyalty Points Settings & Earning Rules", href: "/sales-marketing/settings/loyalty-rules", icon: "crown" },
    ],
  },
];
