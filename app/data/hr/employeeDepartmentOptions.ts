import { navItems } from "@/app/data/navigation/main";

/** Department labels aligned with top navigation (excludes Dashboard). */
export const employeeDepartmentLabels = navItems
  .filter((item) => item.label !== "Dashboard")
  .map((item) => item.label);

/** Includes Accounts, Purchase & Stores, Sales & Marketing, and all other nav modules. */
export const employeeDepartmentFilterOptions = [
  { value: "ALL", label: "All departments" },
  ...employeeDepartmentLabels.map((label) => ({ value: label, label })),
];
