"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Briefcase,
  Clock,
  Eye,
  Trash2,
  Pencil,
  Building2,
  Printer,
  FileSpreadsheet,
  FileText,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  EmptyState,
  FormField,
  FOSearchToolbar,
} from "@/components/frontoffice/ui";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { ModulePageShell } from "@/components/pms";
import { EmployeeStatusBadge } from "@/components/hr/shared/EmployeeStatusBadge";
import {
  hrEmployeeService,
  hrDepartmentService,
  hrDesignationService,
  hrEmploymentTypeService,
  hrShiftTypeService,
} from "@/services/human-resources";
import { mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import { employeeDepartmentFilterOptions } from "@/app/data/hr/employeeDepartmentOptions";
import { ExportMenu } from "@/components/shared/ExportMenu";
import {
  exportTableAsCsv,
  exportTableAsExcel,
  exportTableAsPdf,
  type ExportColumn,
} from "@/lib/exportUtils";
import {
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableCheckboxCell,
  ListTableCheckboxHeader,
  ListTableFooter,
  ListTableHead,
  ListTableHeaderCell,
  ListTablePersonCell,
  ListTableRow,
  ListTableRowMenu,
  ListSummaryCards,
  ToolbarFilterGroup,
  ToolbarFilterSelect,
  getListTableInitials,
} from "@/components/shared/list-table";

function formatEmployeeSalary(amount: number) {
  return formatMoney(amount);
}

function formatEmployeeMetaLine(emp: EmployeeItem) {
  return `${emp.empCode} · ${emp.email} · ${emp.phone}`;
}

const employeeExportColumns: ExportColumn<Record<string, string | number>>[] = [
  { key: "empCode", header: "Employee Code" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "department", header: "Department" },
  { key: "designation", header: "Role" },
  { key: "employmentType", header: "Employment Type" },
  { key: "shiftType", header: "Shift" },
  { key: "salaryStructureName", header: "Salary Structure" },
  { key: "status", header: "Status" },
  { key: "joinDate", header: "Join Date" },
];

function buildEmployeeExportRows(employees: EmployeeItem[]) {
  return employees.map((emp) => ({
    empCode: emp.empCode,
    name: emp.name,
    email: emp.email,
    phone: emp.phone,
    department: emp.department,
    designation: emp.designation,
    employmentType: emp.employmentType,
    shiftType: emp.shiftType,
    salaryStructureName: emp.salaryStructureName ?? "Not assigned",
    structureGrossSalary: emp.structureGrossSalary ?? 0,
    status: emp.status,
    joinDate: emp.joinDate,
  }));
}

const employeeExportOptions = [
  {
    id: "csv",
    label: "CSV Spreadsheet",
    description: "Comma-separated values (.csv)",
    icon: <FileText className="h-3.5 w-3.5 text-blue-700" />,
  },
  {
    id: "excel",
    label: "Excel Workbook",
    description: "Microsoft Excel (.xls)",
    icon: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />,
  },
  {
    id: "pdf",
    label: "PDF Document",
    description: "Print or save as PDF (.pdf)",
    icon: <FileCode className="h-3.5 w-3.5 text-rose-600" />,
  },
] as const;

const employeeStatusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "On Leave", label: "On Leave" },
  { value: "Inactive", label: "Inactive" },
] as const;

const employeeShiftFilterOptions = [
  { value: "ALL", label: "All shifts" },
  { value: "Morning Shift", label: "Morning Shift" },
  { value: "Evening Shift", label: "Evening Shift" },
  { value: "Night Shift", label: "Night Shift" },
  { value: "General Shift", label: "General Shift" },
] as const;

const employeeEmploymentTypeFilterOptions = [
  { value: "ALL", label: "All employment types" },
  { value: "Permanent", label: "Permanent" },
  { value: "Contractual", label: "Contractual" },
  { value: "Probation", label: "Probation" },
  { value: "Trainee", label: "Trainee" },
] as const;

type EmployeeQuickFilter = "all" | "active" | "permanent" | "contract" | "on-leave";

const employeeQuickFilters: { id: EmployeeQuickFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "permanent", label: "Permanent" },
  { id: "contract", label: "Contract / Probation" },
  { id: "on-leave", label: "On Leave" },
];

function matchesEmployeeQuickFilter(
  emp: EmployeeItem,
  filter: EmployeeQuickFilter,
): boolean {
  switch (filter) {
    case "active":
      return emp.status === "Active";
    case "permanent":
      return emp.employmentType === "Permanent";
    case "contract":
      return (
        emp.employmentType === "Contractual" ||
        emp.employmentType === "Probation" ||
        emp.employmentType === "Trainee"
      );
    case "on-leave":
      return emp.status === "On Leave";
    case "all":
    default:
      return true;
  }
}

export function EmployeeListView() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilter, setActiveQuickFilter] = useState<EmployeeQuickFilter>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [rows, deptRows, desigRows, empTypeRows, shiftRows] = await Promise.all([
          hrEmployeeService.list(),
          hrDepartmentService.list().catch(() => []),
          hrDesignationService.list().catch(() => []),
          hrEmploymentTypeService.list().catch(() => []),
          hrShiftTypeService.list().catch(() => []),
        ]);

        const deptMap = new Map((deptRows as Record<string, unknown>[]).map((d) => [
          String(d.id),
          String(d.departmentName || d.name || d.department_name || "").trim(),
        ]));
        const desigMap = new Map((desigRows as Record<string, unknown>[]).map((d) => [
          String(d.id),
          String(d.designationTitle || d.designationName || d.designation_title || d.designation_name || d.title || d.name || "").trim(),
        ]));
        const empTypeMap = new Map((empTypeRows as Record<string, unknown>[]).map((t) => [
          String(t.id),
          String(t.typeName || t.type_name || t.name || t.workingTerm || "").trim(),
        ]));
        const shiftMap = new Map((shiftRows as Record<string, unknown>[]).map((s) => [
          String(s.id),
          String(s.shiftName || s.shift_name || s.name || "").trim(),
        ]));

        const isUuid = (val?: string) =>
          typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());

        const mapped = (rows as Record<string, unknown>[]).map((r) => {
          const emp = mapEmployeeFromApi(r);
          const rawDeptId = String(r.departmentId || r.department_id || "");
          const rawDesigId = String(r.designationId || r.designation_id || "");
          const rawEmpTypeId = String(r.employmentTypeId || r.employment_type_id || "");
          const rawShiftId = String(r.shiftTypeId || r.shift_type_id || "");

          if (!emp.department || isUuid(emp.department)) {
            emp.department = (isUuid(emp.department) ? deptMap.get(emp.department) : "") || deptMap.get(rawDeptId) || (isUuid(emp.department) ? "" : emp.department) || "General";
          }
          if (!emp.designation || isUuid(emp.designation)) {
            emp.designation = (isUuid(emp.designation) ? desigMap.get(emp.designation) : "") || desigMap.get(rawDesigId) || (isUuid(emp.designation) ? "" : emp.designation) || "Staff";
          }
          if (!emp.employmentType || isUuid(emp.employmentType)) {
            emp.employmentType = ((isUuid(emp.employmentType) ? empTypeMap.get(emp.employmentType) : "") || empTypeMap.get(rawEmpTypeId) || (isUuid(emp.employmentType) ? "Permanent" : emp.employmentType) || "Permanent") as EmployeeItem["employmentType"];
          }
          if (!emp.shiftType || isUuid(emp.shiftType)) {
            emp.shiftType = ((isUuid(emp.shiftType) ? shiftMap.get(emp.shiftType) : "") || shiftMap.get(rawShiftId) || (isUuid(emp.shiftType) ? "General Shift" : emp.shiftType) || "General Shift") as EmployeeItem["shiftType"];
          }
          return emp;
        });

        if (!cancelled) setEmployees(mapped);
      } catch (e) {
        if (!cancelled) {
          setToastMessage(e instanceof Error ? e.message : "Failed to load employees");
          setEmployees([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          emp.empCode.toLowerCase().includes(q) ||
          emp.name.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.phone.includes(q);
        if (!matchesQuery) return false;
      }

      // Department
      if (selectedDepartment !== "ALL" && emp.department !== selectedDepartment) {
        return false;
      }

      if (selectedStatus !== "ALL" && emp.status !== selectedStatus) {
        return false;
      }

      if (selectedEmploymentType !== "ALL" && emp.employmentType !== selectedEmploymentType) {
        return false;
      }

      if (selectedShift !== "ALL" && emp.shiftType !== selectedShift) {
        return false;
      }

      if (!matchesEmployeeQuickFilter(emp, activeQuickFilter)) {
        return false;
      }

      return true;
    });
  }, [
    employees,
    searchQuery,
    selectedDepartment,
    selectedStatus,
    selectedEmploymentType,
    selectedShift,
    activeQuickFilter,
  ]);

  const hasToolbarFilters =
    selectedDepartment !== "ALL" || selectedStatus !== "ALL" || selectedShift !== "ALL";

  const hasActiveAdvancedFilters = selectedEmploymentType !== "ALL";

  const clearAdvancedFilters = () => {
    setSelectedEmploymentType("ALL");
  };

  const clearToolbarFilters = () => {
    setSelectedDepartment("ALL");
    setSelectedStatus("ALL");
    setSelectedShift("ALL");
  };

  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        employeeQuickFilters.map((filter) => [
          filter.id,
          employees.filter((emp) => matchesEmployeeQuickFilter(emp, filter.id)).length,
        ]),
      ) as Record<EmployeeQuickFilter, number>,
    [employees],
  );

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveQuickFilter("all");
    clearToolbarFilters();
    clearAdvancedFilters();
  };

  const exportEmployees = useMemo(() => {
    if (selectedIds.size === 0) return filteredEmployees;
    return filteredEmployees.filter((emp) => selectedIds.has(emp.id));
  }, [filteredEmployees, selectedIds]);

  const handleEmployeeExport = (format: string) => {
    if (exportEmployees.length === 0) {
      setToastMessage("No employees available to export.");
      return;
    }

    const rows = buildEmployeeExportRows(exportEmployees);
    const dateStamp = new Date().toISOString().split("T")[0];
    const baseName = `Employee_List_${dateStamp}`;
    const title = `Employee List (${exportEmployees.length})`;

    try {
      if (format === "csv") {
        exportTableAsCsv(`${baseName}.csv`, employeeExportColumns, rows);
        setToastMessage(`Exported ${exportEmployees.length} employees to CSV.`);
        return;
      }

      if (format === "excel") {
        exportTableAsExcel(`${baseName}.xls`, title, employeeExportColumns, rows);
        setToastMessage(`Exported ${exportEmployees.length} employees to Excel.`);
        return;
      }

      if (format === "pdf") {
        exportTableAsPdf(title, employeeExportColumns, rows);
        setToastMessage(`Opened ${exportEmployees.length} employees for PDF export.`);
      }
    } catch (error) {
      setToastMessage(
        error instanceof Error ? error.message : "Export failed. Please try again.",
      );
    }
  };

  const totalCount = employees.length;
  const activeCount = useMemo(
    () => employees.filter((e) => e.status === "Active").length,
    [employees],
  );
  const permanentCount = useMemo(
    () => employees.filter((e) => e.employmentType === "Permanent").length,
    [employees],
  );
  const onLeaveCount = useMemo(
    () => employees.filter((e) => e.status === "On Leave").length,
    [employees],
  );

  const summaryStats = useMemo(
    () => [
      {
        label: "Total Headcount",
        value: totalCount,
        color: "#0284c7",
        icon: "users" as const,
        filterId: "all",
      },
      {
        label: "Active",
        value: activeCount,
        color: "#16a34a",
        icon: "user-check" as const,
        filterId: "active",
      },
      {
        label: "Permanent",
        value: permanentCount,
        color: "#0ea5e9",
        icon: "briefcase" as const,
        filterId: "permanent",
      },
      {
        label: "On Leave",
        value: onLeaveCount,
        color: "#f59e0b",
        icon: "building" as const,
        filterId: "on-leave",
      },
    ],
    [totalCount, activeCount, permanentCount, onLeaveCount],
  );

  // Selection handlers
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  const handleBulkAction = (actionName: string) => {
    if (selectedIds.size === 0) return;

    if (actionName === "Delete") {
      setEmployees((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setToastMessage(`✓ ${selectedIds.size} employee record(s) deleted successfully.`);
      setSelectedIds(new Set());
    } else {
      setToastMessage(`✓ ${actionName} applied for ${selectedIds.size} selected employee(s).`);
    }
  };

  const openEmployeeProfile = (emp: EmployeeItem) => {
    router.push(`/human-resources/employees/profile?id=${emp.id}`);
  };

  const allSelected =
    filteredEmployees.length > 0 && selectedIds.size === filteredEmployees.length;

  const getEmployeeRowMenuItems = (emp: EmployeeItem) => [
    {
      icon: Eye,
      label: "View Profile",
      onClick: () => openEmployeeProfile(emp),
    },
    {
      icon: Pencil,
      label: "Edit",
      onClick: () => setToastMessage(`Edit ${emp.empCode} coming soon.`),
    },
    {
      icon: Printer,
      label: "Print",
      onClick: () => window.print(),
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: () => {
        setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
        setToastMessage(`✓ ${emp.name} removed from employee list.`);
      },
      danger: true,
    },
  ];

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Employee List"
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Employee List" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      primaryAction={{
        label: "Add Employee",
        onClick: () => router.push("/human-resources/employees/add"),
      }}
      secondaryActions={
        <ExportMenu
          label="Export"
          options={[...employeeExportOptions]}
          onExport={handleEmployeeExport}
          disabled={exportEmployees.length === 0}
        />
      }
    >
      <ListSummaryCards
        stats={summaryStats}
        activeFilterId={activeQuickFilter}
        onFilterClick={(id) => setActiveQuickFilter(id as EmployeeQuickFilter)}
      />

      <FOSearchToolbar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by code, name, role, email, or phone…"
        beforeFilters={
          <ToolbarFilterGroup>
            <ToolbarFilterSelect
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={[...employeeDepartmentFilterOptions]}
              ariaLabel="Filter by department"
            />
            <ToolbarFilterSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[...employeeStatusFilterOptions]}
              ariaLabel="Filter by status"
            />
            <ToolbarFilterSelect
              value={selectedShift}
              onChange={setSelectedShift}
              options={[...employeeShiftFilterOptions]}
              ariaLabel="Filter by shift"
            />
          </ToolbarFilterGroup>
        }
        filterPills={{
          active: activeQuickFilter,
          onChange: (id) => setActiveQuickFilter(id as EmployeeQuickFilter),
          options: employeeQuickFilters.map((filter) => ({
            id: filter.id,
            label: `${filter.label} ${filterCounts[filter.id]}`,
          })),
        }}
        hasActiveAdvancedFilters={hasActiveAdvancedFilters}
        onClearAdvancedFilters={clearAdvancedFilters}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Employment Type">
              <DropdownSelect
                value={selectedEmploymentType}
                onChange={setSelectedEmploymentType}
                options={[...employeeEmploymentTypeFilterOptions]}
                defaultValue="ALL"
                highlightActive
                aria-label="Filter by employment type"
              />
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {filteredEmployees.length} of {employees.length} employees
              </div>
            </FormField>
          </div>
        }
        selectionBar={
          selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-900">
                {selectedIds.size} employee{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-white"
                  onClick={() => handleBulkAction("Export Selected")}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export selected
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 bg-white text-rose-700 hover:bg-rose-50"
                  onClick={() => handleBulkAction("Delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete selected
                </Button>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </button>
              </div>
            </div>
          ) : undefined
        }
      />

      {/* Employee directory table — same layout pattern as Front Office All Bookings */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {filteredEmployees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description="Try adjusting your search or filter criteria."
            action={
              <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="space-y-0 divide-y divide-slate-100 md:hidden">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEmployeeProfile(emp)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openEmployeeProfile(emp);
                    }
                  }}
                  className="cursor-pointer p-4 transition-colors hover:bg-emerald-50/40 active:bg-emerald-50/60"
                >
                  <div className="flex items-start gap-3">
                    {emp.photoUrl ? (
                      <img
                        src={emp.photoUrl}
                        alt={emp.name}
                        className="h-11 w-11 shrink-0 rounded-xl object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-sm font-bold text-white">
                        {getListTableInitials(emp.name)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-500">{formatEmployeeMetaLine(emp)}</p>
                        </div>
                        <EmployeeStatusBadge status={emp.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                          <Briefcase className="h-3 w-3" />
                          {emp.designation}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                          <Building2 className="h-3 w-3" />
                          {emp.department}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5">
                          <Clock className="h-3 w-3" />
                          {emp.shiftType}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">
                          {emp.salaryStructureName || "No salary structure"}
                        </p>
                        <span className="text-xs text-slate-500">{emp.employmentType}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <ListTable>
              <ListTableHead>
                <ListTableCheckboxHeader
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  ariaLabel="Select all employees"
                />
                <ListTableHeaderCell>Employee</ListTableHeaderCell>
                <ListTableHeaderCell>Role</ListTableHeaderCell>
                <ListTableHeaderCell>Department</ListTableHeaderCell>
                <ListTableHeaderCell>Salary structure</ListTableHeaderCell>
                <ListTableHeaderCell>Status</ListTableHeaderCell>
                <ListTableHeaderCell align="right" className="w-28">
                  Actions
                </ListTableHeaderCell>
              </ListTableHead>
              <ListTableBody>
                {filteredEmployees.map((emp) => (
                  <ListTableRow key={emp.id} onClick={() => openEmployeeProfile(emp)}>
                    <ListTableCheckboxCell
                      checked={selectedIds.has(emp.id)}
                      onChange={() => toggleSelectRow(emp.id)}
                      ariaLabel={`Select ${emp.empCode}`}
                    />
                    <ListTableCell>
                      <ListTablePersonCell
                        name={emp.name}
                        subtitle={formatEmployeeMetaLine(emp)}
                        initials={emp.avatar}
                        photoUrl={emp.photoUrl}
                      />
                    </ListTableCell>
                    <ListTableCell>
                      <p className="font-medium text-slate-800">{emp.designation}</p>
                      <p className="text-xs text-slate-500">{emp.shiftType}</p>
                    </ListTableCell>
                    <ListTableCell>
                      <p className="font-medium text-slate-800">{emp.department}</p>
                      <p className="text-xs text-slate-500">{emp.employmentType}</p>
                    </ListTableCell>
                    <ListTableCell>
                      <p className="font-semibold text-slate-900">
                        {emp.salaryStructureName || "Not assigned"}
                      </p>
                      {(emp.structureGrossSalary ?? 0) > 0 && (
                        <p className="text-xs text-slate-500">
                          Gross {formatMoney(emp.structureGrossSalary!)}
                        </p>
                      )}
                    </ListTableCell>
                    <ListTableCell>
                      <EmployeeStatusBadge status={emp.status} />
                    </ListTableCell>
                    <ListTableCell onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <ListTableRowMenu
                          open={openMenu === emp.id}
                          onToggle={() =>
                            setOpenMenu(openMenu === emp.id ? null : emp.id)
                          }
                          onClose={() => setOpenMenu(null)}
                          items={getEmployeeRowMenuItems(emp)}
                          ariaLabel={`More actions for ${emp.name}`}
                        />
                      </div>
                    </ListTableCell>
                  </ListTableRow>
                ))}
              </ListTableBody>
            </ListTable>

            <ListTableFooter>
              Showing {filteredEmployees.length} employee
              {filteredEmployees.length !== 1 ? "s" : ""}
              {activeQuickFilter !== "all" &&
                ` · filtered by ${employeeQuickFilters.find((f) => f.id === activeQuickFilter)?.label}`}
              {hasToolbarFilters && " · department/status/shift filters on"}
              {hasActiveAdvancedFilters && " · advanced filters on"}
              {" · "}
              Click a row to view employee profile
            </ListTableFooter>
          </>
        )}
      </section>
    </ModulePageShell>
  );
}
