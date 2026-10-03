import type { ModuleNavItem } from "../types";

export const humanResourcesNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/human-resources/dashboard", icon: "layout-grid" },
  { label: "Employee List", href: "/human-resources/employees/list", icon: "users" },
  {
    label: "Attendance & Leave",
    href: "/human-resources/attendance-leave",
    icon: "calendar-clock",
    children: [
      { label: "Attendance", href: "/human-resources/attendance-leave/attendance", icon: "clock" },
      { label: "Shift Management", href: "/human-resources/attendance-leave/shift-management", icon: "repeat" },
      { label: "Leave Management", href: "/human-resources/attendance-leave/leave-management", icon: "calendar" },
      { label: "Overtime", href: "/human-resources/attendance-leave/overtime", icon: "timer" },
      { label: "Weekly Off", href: "/human-resources/attendance-leave/weekly-off", icon: "calendar-off" },
    ],
  },
  {
    label: "Payroll",
    href: "/human-resources/payroll",
    icon: "wallet",
    children: [
      { label: "Process Payroll", href: "/human-resources/payroll/process-payroll", icon: "credit-card" },
      { label: "Salary Increments", href: "/human-resources/payroll/increments", icon: "trending-up" },
      { label: "Salary Structure", href: "/human-resources/payroll/salary-structure", icon: "layers" },
      { label: "Payslips", href: "/human-resources/payroll/payslips", icon: "file-spreadsheet" },
      { label: "Payroll Settings", href: "/human-resources/payroll/payroll-settings", icon: "settings" },
    ],
  },
  {
    label: "Grievances",
    href: "/human-resources/grievances",
    icon: "message-square-warning",
  },
  { label: "Reports", href: "/human-resources/reports", icon: "bar-chart" },
  { label: "User Management", href: "/human-resources/settings/users", icon: "user-check" },
  {
    label: "Masters",
    href: "/human-resources/masters",
    icon: "book-open",
    children: [
      { label: "Departments", href: "/human-resources/masters/departments", icon: "building-2" },
      { label: "Designations", href: "/human-resources/masters/designations", icon: "award" },
      { label: "Employment Types", href: "/human-resources/masters/employment-types", icon: "briefcase" },
      { label: "Shift Types", href: "/human-resources/masters/shift-types", icon: "sun" },
      { label: "Leave Types", href: "/human-resources/masters/leave-types", icon: "calendar-heart" },
      { label: "Leave Policies", href: "/human-resources/masters/leave-policies", icon: "clipboard-list" },
      { label: "Holiday Calendar", href: "/human-resources/masters/holiday-calendar", icon: "calendar-range" },
      { label: "Salary Components", href: "/human-resources/masters/salary-components", icon: "coins" },
      { label: "Document Masters", href: "/human-resources/masters/document-masters", icon: "file-cog" },
      { label: "Complaint Categories", href: "/human-resources/masters/complaint-categories", icon: "tags" },
    ],
  },
];
