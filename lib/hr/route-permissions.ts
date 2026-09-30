import type { ModuleNavItem } from "@/app/data/types";

/** Maps HR admin URL paths to platform module permission keys. */
const PATH_MODULE_RULES: Array<{ pattern: RegExp; moduleKey: string }> = [
  { pattern: /^\/human-resources\/?$/, moduleKey: "hr_dashboard" },
  { pattern: /^\/human-resources\/dashboard\/?$/, moduleKey: "hr_dashboard" },
  { pattern: /^\/human-resources\/employees\/add\/?$/, moduleKey: "hr_employees_add" },
  { pattern: /^\/human-resources\/employees\/profile\/?$/, moduleKey: "hr_employees_profile" },
  { pattern: /^\/human-resources\/employees(\/list)?\/?$/, moduleKey: "hr_employees" },
  { pattern: /^\/human-resources\/attendance-leave\/attendance\/?$/, moduleKey: "hr_attendance" },
  { pattern: /^\/human-resources\/attendance-leave\/shift-management\/?$/, moduleKey: "hr_shift_management" },
  { pattern: /^\/human-resources\/attendance-leave\/leave-management\/?$/, moduleKey: "hr_leave_management" },
  { pattern: /^\/human-resources\/attendance-leave\/overtime\/?$/, moduleKey: "hr_overtime" },
  { pattern: /^\/human-resources\/attendance-leave\/weekly-off\/?$/, moduleKey: "hr_weekly_off" },
  { pattern: /^\/human-resources\/payroll\/process-payroll\/?$/, moduleKey: "hr_process_payroll" },
  {
    pattern: /^\/human-resources\/payroll\/(increments|compensation-revisions)\/?$/,
    moduleKey: "hr_salary_structure",
  },
  { pattern: /^\/human-resources\/payroll\/salary-structure\/?$/, moduleKey: "hr_salary_structure" },
  { pattern: /^\/human-resources\/payroll\/payslips\/?$/, moduleKey: "hr_payslips" },
  { pattern: /^\/human-resources\/payroll\/payroll-settings\/?$/, moduleKey: "hr_payroll_settings" },
  { pattern: /^\/human-resources\/grievances\/raise-complaint\/?$/, moduleKey: "hr_raise_complaint" },
  { pattern: /^\/human-resources\/grievances\/complaint-list\/?$/, moduleKey: "hr_complaint_list" },
  { pattern: /^\/human-resources\/grievances\/complaint-categories\/?$/, moduleKey: "hr_complaint_categories" },
  { pattern: /^\/human-resources\/grievances(\/complaint-status|\/status)?\/?$/, moduleKey: "hr_complaint_status" },
  { pattern: /^\/human-resources\/reports\/?$/, moduleKey: "hr_reports" },
  { pattern: /^\/human-resources\/settings\/users\/?$/, moduleKey: "hr_user_management" },
  { pattern: /^\/human-resources\/users\/?$/, moduleKey: "hr_user_management" },
  { pattern: /^\/human-resources\/masters\/departments\/?$/, moduleKey: "hr_departments" },
  { pattern: /^\/human-resources\/masters\/designations\/?$/, moduleKey: "hr_designations" },
  { pattern: /^\/human-resources\/masters\/employment-types\/?$/, moduleKey: "hr_employment_types" },
  { pattern: /^\/human-resources\/masters\/shift-types\/?$/, moduleKey: "hr_shift_types" },
  { pattern: /^\/human-resources\/masters\/leave-types\/?$/, moduleKey: "hr_leave_types" },
  { pattern: /^\/human-resources\/masters\/leave-policies\/?$/, moduleKey: "hr_leave_policies" },
  { pattern: /^\/human-resources\/masters\/holiday-calendar\/?$/, moduleKey: "hr_holiday_calendar" },
  { pattern: /^\/human-resources\/masters\/salary-components\/?$/, moduleKey: "hr_salary_components" },
  { pattern: /^\/human-resources\/masters\/document-masters\/?$/, moduleKey: "hr_document_masters" },
];

const HUB_ROUTE_MODULES: Record<string, string[]> = {
  "/human-resources/attendance-leave": [
    "hr_attendance",
    "hr_shift_management",
    "hr_leave_management",
    "hr_overtime",
    "hr_weekly_off",
  ],
  "/human-resources/payroll": [
    "hr_process_payroll",
    "hr_salary_structure",
    "hr_payslips",
    "hr_payroll_settings",
  ],
  "/human-resources/grievances": [
    "hr_raise_complaint",
    "hr_complaint_list",
    "hr_complaint_categories",
    "hr_complaint_status",
  ],
  "/human-resources/masters": [
    "hr_departments",
    "hr_designations",
    "hr_employment_types",
    "hr_shift_types",
    "hr_leave_types",
    "hr_leave_policies",
    "hr_holiday_calendar",
    "hr_salary_components",
    "hr_document_masters",
  ],
};

const FALLBACK_ROUTE_ORDER = [
  "/human-resources/dashboard",
  "/human-resources/employees/list",
  "/human-resources/attendance-leave/attendance",
  "/human-resources/attendance-leave/shift-management",
  "/human-resources/attendance-leave/leave-management",
  "/human-resources/payroll/process-payroll",
  "/human-resources/payroll/payslips",
  "/human-resources/reports",
  "/human-resources/masters/departments",
  "/human-resources/settings/users",
];

export function resolveModuleKeyFromPathname(pathname: string): string | null {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/human-resources/dashboard";
  for (const rule of PATH_MODULE_RULES) {
    if (rule.pattern.test(path)) return rule.moduleKey;
  }
  return null;
}

export function canAccessPath(
  pathname: string,
  canRead: (moduleKey: string) => boolean,
): boolean {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/human-resources/dashboard";
  const moduleKey = resolveModuleKeyFromPathname(path);
  if (moduleKey) return canRead(moduleKey);

  const hubKeys = HUB_ROUTE_MODULES[path];
  if (hubKeys) return hubKeys.some((key) => canRead(key));

  return false;
}

export function firstAccessiblePath(
  canRead: (moduleKey: string) => boolean,
): string | null {
  for (const path of FALLBACK_ROUTE_ORDER) {
    if (canAccessPath(path, canRead)) return path;
  }
  return null;
}

export function filterNavItemsByPermissions(
  items: ModuleNavItem[],
  canRead: (moduleKey: string) => boolean,
): ModuleNavItem[] {
  return items
    .map((item) => {
      if (item.children?.length) {
        const children = filterNavItemsByPermissions(item.children, canRead);
        if (!children.length) return null;
        return { ...item, children };
      }

      const moduleKey = resolveModuleKeyFromPathname(item.href);
      if (moduleKey && !canRead(moduleKey)) return null;

      const hubKeys = HUB_ROUTE_MODULES[item.href.replace(/\/$/, "")];
      if (!moduleKey && hubKeys && !hubKeys.some((key) => canRead(key))) return null;

      return item;
    })
    .filter((item): item is ModuleNavItem => item !== null);
}
