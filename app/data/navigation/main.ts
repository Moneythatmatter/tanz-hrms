import type { NavItem } from "../types";

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/human-resources/dashboard", icon: "layout-grid" },
  { label: "Employees", href: "/human-resources/employees/list", icon: "users" },
  { label: "Attendance & Leave", href: "/human-resources/attendance-leave/attendance", icon: "calendar-clock" },
  { label: "Payroll", href: "/human-resources/payroll/process-payroll", icon: "wallet" },
  { label: "Grievances", href: "/human-resources/grievances/complaint-list", icon: "message-square-warning" },
  { label: "Masters", href: "/human-resources/masters", icon: "book-open" },
  { label: "Reports", href: "/human-resources/reports", icon: "bar-chart" },
];
