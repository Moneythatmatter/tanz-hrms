"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  CalendarOff,
  Search,
  Filter,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Check,
  X,
  Printer,
  ChevronDown,
  Building2,
  User,
  ShieldAlert,
  Sparkles,
  Info,
  Repeat,
  Calendar,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Modal, Button, StatusBadge, Drawer } from "@/components/ui";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { HrSearchFilterToolbar } from "@/components/hr/shared/HrSearchFilterToolbar";
import { ReportExportModal } from "@/components/shared/ReportExportModal";
import {
  ListSummaryCards,
  ToolbarFilterGroup,
  ToolbarFilterSelect,
} from "@/components/shared/list-table";
import { employeeDepartmentFilterOptions } from "@/app/data/hr/employeeDepartmentOptions";
import { exportGenericReport, filterByIsoDateRange, normalizeToIsoDate, type ReportExportOptions } from "@/lib/hr/report-export";
import type { ExportColumn } from "@/lib/exportUtils";
import { cn } from "@/lib/utils";
import { hrWeeklyOffService, hrEmployeeService } from "@/services/human-resources";
import { mapWeeklyOffFromApi, mapWeeklyOffToApi, mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

export interface WeeklyOffAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  type: "Fixed" | "Rotational";
  days: string[]; // e.g. ["Sunday"], ["Saturday", "Sunday"]
  rotationPattern?: string; // e.g. "W1-Sun, W2-Mon, W3-Tue, W4-Wed"
  effectiveFrom: string;
  effectiveTo: string;
  status: "Active" | "Upcoming" | "Expired";
  assignedBy: string;
  remarks?: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const weeklyOffTypeFilterOptions = [
  { value: "ALL", label: "All off types" },
  { value: "Fixed", label: "Fixed schedule" },
  { value: "Rotational", label: "Rotational" },
] as const;

const weeklyOffDayFilterOptions = [
  { value: "ALL", label: "All days" },
  ...DAYS_OF_WEEK.map((d) => ({ value: d, label: d })),
] as const;

const weeklyOffStatusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Upcoming", label: "Upcoming" },
  { value: "Expired", label: "Expired" },
] as const;

type WeeklyOffExportRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  type: string;
  days: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: string;
};

const weeklyOffExportColumns: ExportColumn<WeeklyOffExportRow>[] = [
  { key: "employeeId", header: "Employee ID" },
  { key: "employeeName", header: "Employee Name" },
  { key: "department", header: "Department" },
  { key: "type", header: "Off Type" },
  { key: "days", header: "Weekly Off Day(s)" },
  { key: "effectiveFrom", header: "Effective From" },
  { key: "effectiveTo", header: "Effective To" },
  { key: "status", header: "Status" },
];

export function WeeklyOffView() {
  const [assignments, setAssignments] = useState<WeeklyOffAssignment[]>([])
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const loadWeeklyOffs = async () => {
    try {
      const [rows, empRows] = await Promise.all([hrWeeklyOffService.list(), hrEmployeeService.list()]);
      const emps = empRows.map(mapEmployeeFromApi);
      setEmployees(emps);
      const lookup = new Map(emps.map((e) => [e.id, e]));
      setAssignments(rows.map((row) => mapWeeklyOffFromApi(row, lookup.get(String(row.employeeId)))));
      if (emps[0]) setAssignEmpId(emps[0].id);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load weekly offs");
      setAssignments([]);
      setEmployees([]);
    }
  };

  useEffect(() => { void loadWeeklyOffs(); }, []);



  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals & Drawers state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<WeeklyOffAssignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<WeeklyOffAssignment | null>(null);

  // Single Assign Form State (With Unified Searchable Combobox & Auto-Close)
  const [assignEmpId, setAssignEmpId] = useState("");
  const [assignEmpQuery, setAssignEmpQuery] = useState("");
  const [isAssignEmpComboboxOpen, setIsAssignEmpComboboxOpen] = useState(false);
  const assignComboboxRef = useRef<HTMLDivElement>(null);
  const [assignType, setAssignType] = useState<"Fixed" | "Rotational">("Fixed");
  const [assignDays, setAssignDays] = useState<string[]>(["Sunday"]);
  const [rotationalFrequency, setRotationalFrequency] = useState<"Weekly Roster Sync" | "Custom Monthly Cycle" | "Shift Rotation">("Weekly Roster Sync");
  const [rotationalWeek1Day, setRotationalWeek1Day] = useState("Sunday");
  const [rotationalWeek2Day, setRotationalWeek2Day] = useState("Monday");
  const [rotationalWeek3Day, setRotationalWeek3Day] = useState("Tuesday");
  const [rotationalWeek4Day, setRotationalWeek4Day] = useState("Wednesday");
  const [assignRotationPattern, setAssignRotationPattern] = useState("");
  const [assignEffectiveFrom, setAssignEffectiveFrom] = useState("");
  const [assignEffectiveTo, setAssignEffectiveTo] = useState("");
  const [assignRemarks, setAssignRemarks] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [previewDepartment, setPreviewDepartment] = useState("ALL");
  const [staffingPreview, setStaffingPreview] = useState<Awaited<
    ReturnType<typeof hrWeeklyOffService.staffingPreview>
  > | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Close Employee Combobox Popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assignComboboxRef.current && !assignComboboxRef.current.contains(event.target as Node)) {
        setIsAssignEmpComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Bulk Assign Form State
  const [bulkDepartment, setBulkDepartment] = useState("");
  const [bulkType, setBulkType] = useState<"Fixed" | "Rotational">("Fixed");
  const [bulkDays, setBulkDays] = useState<string[]>(["Sunday"]);
  const [bulkEffectiveFrom, setBulkEffectiveFrom] = useState("");
  const [bulkEffectiveTo, setBulkEffectiveTo] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Filtered Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchSearch =
        a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.days.join(" ").toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || a.department === selectedDepartment;
      const matchType = selectedType === "ALL" || a.type === selectedType;
      const matchDay = selectedDay === "ALL" || a.days.includes(selectedDay);
      const matchStatus = selectedStatus === "ALL" || a.status === selectedStatus;

      return matchSearch && matchDept && matchType && matchDay && matchStatus;
    });
  }, [assignments, searchTerm, selectedDepartment, selectedType, selectedDay, selectedStatus]);

  // KPI Metrics (derived from assignments — no mock inflation)
  const kpiMetrics = useMemo(() => {
    const totalAssigned = assignments.length;
    const fixed = assignments.filter((a) => a.type === "Fixed" && a.status === "Active").length;
    const rotational = assignments.filter((a) => a.type === "Rotational" && a.status === "Active").length;
    const upcoming = assignments.filter((a) => a.status === "Upcoming").length;
    return { totalAssigned, fixed, rotational, upcoming };
  }, [assignments]);

  const summaryStats = useMemo(
    () => [
      { label: "Employees assigned", value: kpiMetrics.totalAssigned, color: "#16a34a", icon: "users" as const },
      { label: "Fixed weekly off", value: kpiMetrics.fixed, color: "#0284c7", icon: "calendar-off" as const, filterId: "Fixed" },
      { label: "Rotational weekly off", value: kpiMetrics.rotational, color: "#f59e0b", icon: "repeat" as const, filterId: "Rotational" },
      { label: "Upcoming changes", value: kpiMetrics.upcoming, color: "#9333ea", icon: "clock" as const, filterId: "Upcoming" },
    ],
    [kpiMetrics],
  );

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedDepartment !== "ALL" ||
    selectedType !== "ALL" ||
    selectedDay !== "ALL" ||
    selectedStatus !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("ALL");
    setSelectedType("ALL");
    setSelectedDay("ALL");
    setSelectedStatus("ALL");
  };

  const handleStatFilter = (filterId: string) => {
    if (filterId === "Fixed" || filterId === "Rotational") {
      setSelectedType((prev) => (prev === filterId ? "ALL" : filterId));
      return;
    }
    if (filterId === "Upcoming") {
      setSelectedStatus((prev) => (prev === "Upcoming" ? "ALL" : "Upcoming"));
    }
  };

  const handleWeeklyOffExport = async (options: ReportExportOptions) => {
    setExporting(true);
    try {
      const ranged = filterByIsoDateRange(
        filteredAssignments,
        (a) => normalizeToIsoDate(a.effectiveFrom),
        options.fromDate,
        options.toDate,
      );
      const rows: WeeklyOffExportRow[] = ranged.map((a) => ({
        employeeId: a.employeeId,
        employeeName: a.employeeName,
        department: a.department,
        type: a.type,
        days: a.days.join(", "),
        effectiveFrom: a.effectiveFrom,
        effectiveTo: a.effectiveTo,
        status: a.status,
      }));
      exportGenericReport(rows, weeklyOffExportColumns, options, "Weekly_Off_Schedule");
      setToastMessage(`Exported ${rows.length} weekly off assignment(s).`);
      setIsExportModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const renderWeeklyOffFilters = () => (
    <ToolbarFilterGroup>
      <ToolbarFilterSelect value={selectedDepartment} onChange={setSelectedDepartment} options={[...employeeDepartmentFilterOptions]} ariaLabel="Filter by department" />
      <ToolbarFilterSelect value={selectedType} onChange={setSelectedType} options={[...weeklyOffTypeFilterOptions]} ariaLabel="Filter by off type" />
      <ToolbarFilterSelect value={selectedDay} onChange={setSelectedDay} options={[...weeklyOffDayFilterOptions]} ariaLabel="Filter by off day" />
      <ToolbarFilterSelect value={selectedStatus} onChange={setSelectedStatus} options={[...weeklyOffStatusFilterOptions]} ariaLabel="Filter by status" />
    </ToolbarFilterGroup>
  );

  // Bulk preview list
  const bulkPreviewStaff = useMemo(() => {
    if (!bulkDepartment) return [];
    if (bulkDepartment === "ALL") return employees;
    return employees.filter((a) => a.department === bulkDepartment);
  }, [bulkDepartment]);

  // Handlers
  const handleToggleDay = (day: string, currentDays: string[], setDays: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentDays.includes(day)) {
      if (currentDays.length > 1) {
        setDays(currentDays.filter((d) => d !== day));
      }
    } else {
      setDays([...currentDays, day]);
    }
  };

  // Staffing preview — live when day + date range selected in assign modal
  useEffect(() => {
    if (!isAssignModalOpen || !assignEffectiveFrom || !assignDays.length) {
      setStaffingPreview(null);
      return;
    }
    const previewDay = assignDays[0];
    const effectiveTo = assignEffectiveTo || assignEffectiveFrom;
    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const result = await hrWeeklyOffService.staffingPreview({
          day: previewDay,
          effectiveFrom: assignEffectiveFrom,
          effectiveTo,
          department: previewDepartment,
          excludeEmployeeId: assignEmpId || undefined,
        });
        setStaffingPreview(result);
      } catch {
        setStaffingPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    isAssignModalOpen,
    assignDays,
    assignEffectiveFrom,
    assignEffectiveTo,
    previewDepartment,
    assignEmpId,
  ]);

  const handleOpenSingleAssign = (existing?: WeeklyOffAssignment) => {
    setAssignError(null);
    setPreviewDepartment("ALL");
    if (existing) {
      setEditingAssignment(existing);
      setAssignEmpId(existing.employeeId);
      setAssignEmpQuery(`${existing.employeeName} (${existing.employeeId}) - ${existing.department}`);
      setIsAssignEmpComboboxOpen(false);
      setAssignType(existing.type);
      setAssignDays(existing.days);
      setAssignRotationPattern(existing.rotationPattern || "");
      setAssignRemarks(existing.remarks || "");
      setAssignEffectiveFrom(normalizeToIsoDate(existing.effectiveFrom) ?? "");
      setAssignEffectiveTo(normalizeToIsoDate(existing.effectiveTo) ?? "");
    } else {
      const todayIso = new Date().toISOString().split("T")[0];
      setEditingAssignment(null);
      setAssignEmpId("");
      setAssignEmpQuery("");
      setIsAssignEmpComboboxOpen(false);
      setAssignType("Fixed");
      setAssignDays(["Sunday"]);
      setAssignRotationPattern("");
      setAssignEffectiveFrom(todayIso);
      setAssignEffectiveTo("2026-12-31");
      setAssignRemarks("");
    }
    setIsAssignModalOpen(true);
  };

  const handleSaveSingleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmpId) {
      setAssignError("Please select an employee.");
      return;
    }
    if (!assignEffectiveFrom) {
      setAssignError("Effective from date is required.");
      return;
    }

    const empObj = employees.find((x) => x.id === assignEmpId);
    const empName = empObj?.name ?? assignEmpId;
    const rotationPatternStr = assignType === "Rotational" ? assignRotationPattern || "Rotational Shift Off" : undefined;

    setAssignSaving(true);
    setAssignError(null);
    try {
      const payload = mapWeeklyOffToApi({
        employeeId: assignEmpId,
        type: assignType,
        days: assignDays,
        rotationPattern: rotationPatternStr,
        effectiveFrom: assignEffectiveFrom,
        effectiveTo: assignEffectiveTo || assignEffectiveFrom,
        assignedBy: "HR Admin",
        remarks: assignRemarks || "Assigned via Weekly Off Center.",
      });

      if (editingAssignment) {
        await hrWeeklyOffService.update(editingAssignment.id, payload);
        setToastMessage(`Updated weekly off for ${empName} (${assignDays.join(", ")}).`);
      } else {
        await hrWeeklyOffService.create(payload);
        setToastMessage(`Assigned ${assignDays.join(", ")} weekly off to ${empName}.`);
      }
      await loadWeeklyOffs();
      setIsAssignModalOpen(false);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to save weekly off assignment.");
    } finally {
      setAssignSaving(false);
    }
  };

  const handleSaveBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkDepartment || !bulkEffectiveFrom) {
      setToastMessage("Select department and effective from date.");
      return;
    }

    const targets =
      bulkDepartment === "ALL" ? employees : employees.filter((a) => a.department === bulkDepartment);

    if (targets.length === 0) {
      setToastMessage("No employees found for the selected department.");
      return;
    }

    setBulkSaving(true);
    try {
      let created = 0;
      let skipped = 0;
      for (const emp of targets) {
        try {
          await hrWeeklyOffService.create(
            mapWeeklyOffToApi({
              employeeId: emp.id,
              type: bulkType,
              days: bulkDays,
              effectiveFrom: bulkEffectiveFrom,
              effectiveTo: bulkEffectiveTo || bulkEffectiveFrom,
              assignedBy: "HR Admin (Bulk Action)",
              remarks: "Bulk assigned via Weekly Off Center.",
            }),
          );
          created++;
        } catch {
          skipped++;
        }
      }
      await loadWeeklyOffs();
      setIsBulkModalOpen(false);
      setToastMessage(
        skipped > 0
          ? `Bulk assigned ${bulkDays.join(", ")} to ${created} employee(s). ${skipped} skipped due to conflicts.`
          : `Bulk assigned ${bulkDays.join(", ")} weekly off to ${created} employee(s).`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Bulk assignment failed.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleRemoveAssignment = async (id: string, empName: string) => {
    try {
      await hrWeeklyOffService.remove(id);
      await loadWeeklyOffs();
      setViewingAssignment(null);
      setToastMessage(`Removed weekly off assignment for ${empName}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to remove assignment.");
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Weekly Off Management"
      description="Define recurring weekly rest days (fixed or rotational) for employees and departments. Attendance uses this schedule to verify expected work days and calculate overtime."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Weekly Off Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenSingleAssign()}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Assign Weekly Off
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const todayIso = new Date().toISOString().split("T")[0];
              setBulkEffectiveFrom(todayIso);
              setBulkEffectiveTo(`${new Date().getFullYear()}-12-31`);
              setIsBulkModalOpen(true);
            }}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs cursor-pointer"
          >
            <Users className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Bulk Assign
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Schedule
          </Button>
        </div>
      }
    >
      <ListSummaryCards
        stats={summaryStats}
        className="mb-5"
        activeFilterId={
          selectedType !== "ALL"
            ? selectedType
            : selectedStatus === "Upcoming"
              ? "Upcoming"
              : ""
        }
        onFilterClick={handleStatFilter}
      />

      <HrSearchFilterToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employee, ID or off day..."
        showFilterPanel={showFilterPanel}
        onToggleFilterPanel={() => setShowFilterPanel((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        onReset={resetFilters}
        onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        filters={renderWeeklyOffFilters()}
        extraFilters={renderWeeklyOffFilters()}
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MAIN WEEKLY OFF ASSIGNMENTS TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Weekly Off Type</th>
                <th className="py-3 px-4">Weekly Off Day(s)</th>
                <th className="py-3 px-4">Effective From</th>
                <th className="py-3 px-4">Effective To</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssignments.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                  onClick={() => setViewingAssignment(a)}
                >
                  {/* Employee Info */}
                  <td className="py-3 px-4">
                    <HREmployeeCell
                      name={a.employeeName}
                      id={a.employeeId}
                      avatar={a.avatar}
                      photoUrl={a.photoUrl}
                    />
                  </td>

                  {/* Department */}
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{a.department}</p>
                    <p className="text-[10px] text-slate-500">{a.designation}</p>
                  </td>

                  {/* Type Badge */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg text-xs font-bold border",
                        a.type === "Fixed"
                          ? "bg-slate-100 text-slate-800 border-slate-200"
                          : "bg-amber-100 text-amber-800 border-amber-200"
                      )}
                    >
                      {a.type === "Fixed" ? "Fixed Schedule" : "Rotational Off"}
                    </span>
                  </td>

                  {/* Off Days */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap gap-1">
                        {a.days.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-xs"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                      {a.rotationPattern && (
                        <p className="text-[10px] text-slate-400 font-medium italic">{a.rotationPattern}</p>
                      )}
                    </div>
                  </td>

                  {/* Dates */}
                  <td className="py-3 px-4 font-medium text-slate-800">{a.effectiveFrom}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{a.effectiveTo}</td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: SINGLE WEEKLY OFF ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={editingAssignment ? `Edit Weekly Off: ${editingAssignment.employeeName}` : "Assign Weekly Off"}
        description="Assign recurring rest days to an employee with fixed or rotational patterns."
        size="md"
      >
        <form onSubmit={handleSaveSingleAssign} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee <span className="text-rose-500">*</span>
            </label>

            {/* Single Unified Searchable Employee Combobox */}
            <div className="relative" ref={assignComboboxRef}>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={assignEmpQuery}
                onFocus={() => setIsAssignEmpComboboxOpen(true)}
                onChange={(e) => {
                  setAssignEmpQuery(e.target.value);
                  setIsAssignEmpComboboxOpen(true);
                }}
                placeholder="Type employee name, ID or department to search..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
              />
              {assignEmpQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setAssignEmpQuery("");
                    setAssignEmpId("");
                    setIsAssignEmpComboboxOpen(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              )}

              {/* Combobox Dropdown Results List */}
              {isAssignEmpComboboxOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-1 max-h-56 overflow-y-auto animate-in fade-in-50">
                  {employees.filter((staff) => {
                    if (!assignEmpQuery.trim()) return true;
                    const q = assignEmpQuery.toLowerCase().trim();
                    return (
                      staff.name.toLowerCase().includes(q) ||
                      staff.id.toLowerCase().includes(q) ||
                      staff.department.toLowerCase().includes(q) ||
                      staff.designation.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 font-medium">
                      No matching employee found.
                    </div>
                  ) : (
                    employees.filter((staff) => {
                      if (!assignEmpQuery.trim()) return true;
                      const q = assignEmpQuery.toLowerCase().trim();
                      return (
                        staff.name.toLowerCase().includes(q) ||
                        staff.id.toLowerCase().includes(q) ||
                        staff.department.toLowerCase().includes(q) ||
                        staff.designation.toLowerCase().includes(q)
                      );
                    }).map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => {
                          setAssignEmpId(staff.id);
                          setAssignEmpQuery(`${staff.name} (${staff.id}) - ${staff.department}`);
                          setIsAssignEmpComboboxOpen(false);
                        }}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent",
                          assignEmpId === staff.id && "bg-emerald-50 text-emerald-900 border-emerald-200"
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                            {staff.avatar}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-xs text-slate-900 truncate">
                              {staff.name} <span className="text-[10px] font-semibold text-emerald-700">({staff.id})</span>
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">{staff.designation} • {staff.department}</p>
                          </div>
                        </div>
                        {assignEmpId === staff.id && <Check className="h-4 w-4 text-emerald-600 shrink-0 ml-2" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Weekly Off Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAssignType("Fixed")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition",
                  assignType === "Fixed"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                📌 Fixed Schedule
              </button>

              <button
                type="button"
                onClick={() => setAssignType("Rotational")}
                className={cn(
                  "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition",
                  assignType === "Rotational"
                    ? "bg-amber-50 border-amber-500 text-amber-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                🔄 Rotational Off
              </button>
            </div>
          </div>

          {/* Days Checkboxes Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Weekly Off Day(s) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = assignDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day, assignDays, setAssignDays)}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center",
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Rotational Off Field */}
          {assignType === "Rotational" && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rotation Pattern / Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rotates weekly with shift roster (W1: Mon, W2: Tue)"
                value={assignRotationPattern}
                onChange={(e) => setAssignRotationPattern(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Rotational Off automatically adjusts rest days based on shift roster assignments.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective From <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={assignEffectiveFrom}
                onChange={(e) => setAssignEffectiveFrom(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Effective To <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={assignEffectiveTo}
                onChange={(e) => setAssignEffectiveTo(e.target.value)}
                required
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          {/* Staffing preview — informational only */}
          {assignDays.length > 0 && assignEffectiveFrom && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-900">
                    {assignDays[0]} — Staffing Preview
                  </p>
                  <p className="text-[10px] text-emerald-700/80 font-medium">
                    Active/overlapping weekly offs during the selected period. Informational only — does not block assignment.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase shrink-0">Department</label>
                <select
                  value={previewDepartment}
                  onChange={(e) => setPreviewDepartment(e.target.value)}
                  className="flex-1 text-xs rounded-lg border border-slate-200 p-1.5 bg-white font-semibold"
                >
                  <option value="ALL">All departments</option>
                  {[...employeeDepartmentFilterOptions]
                    .filter((o) => o.value !== "ALL")
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </div>

              {previewLoading ? (
                <p className="text-xs text-slate-500 font-medium py-2">Loading coverage...</p>
              ) : staffingPreview && staffingPreview.employees.length > 0 ? (
                <>
                  {Object.keys(staffingPreview.departmentCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(staffingPreview.departmentCounts).map(([dept, count]) => (
                        <span
                          key={dept}
                          className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px] font-bold text-emerald-800"
                        >
                          {dept}: {count} off
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {staffingPreview.employees.map((emp) => (
                      <div
                        key={`${emp.assignmentId}-${emp.employeeId}`}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-emerald-100 text-xs"
                      >
                        <span className="font-bold text-slate-900">{emp.employeeName}</span>
                        <span className="text-slate-500 text-[11px] font-semibold">{emp.department}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] font-bold text-emerald-800">
                    {staffingPreview.total} employee{staffingPreview.total === 1 ? "" : "s"} already have {assignDays[0]} off during this period.
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 font-medium py-1">
                  No overlapping {assignDays[0]} weekly offs found for the selected period.
                </p>
              )}
            </div>
          )}

          {assignError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-800">
              {assignError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-xl text-xs"
              disabled={assignSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={assignSaving}
            >
              {assignSaving ? "Saving..." : "Save Assignment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: BULK WEEKLY OFF ASSIGNMENT MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Assign Weekly Off to Department"
        description="Assign weekly rest days in bulk across an entire department."
        size="lg"
      >
        <form onSubmit={handleSaveBulkAssign} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={bulkDepartment}
                onChange={(e) => setBulkDepartment(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
              >
                <option value="">-- Select Department --</option>
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
                <option value="Kitchen">Kitchen</option>
                <option value="HR">HR</option>
                <option value="Accounts">Accounts</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Weekly Off Type</label>
              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value as "Fixed" | "Rotational")}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="Fixed">Fixed Schedule</option>
                <option value="Rotational">Rotational Shift Off</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Off Day(s)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = bulkDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day, bulkDays, setBulkDays)}
                    className={cn(
                      "py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center",
                      isSelected
                        ? "bg-emerald-700 text-white border-emerald-800 shadow-2xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Effective From</label>
              <input
                type="date"
                value={bulkEffectiveFrom}
                onChange={(e) => setBulkEffectiveFrom(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Effective To</label>
              <input
                type="date"
                value={bulkEffectiveTo}
                onChange={(e) => setBulkEffectiveTo(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          {/* Interactive Affected Staff Preview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              Affected Employees ({bulkPreviewStaff.length} Staff Selected):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5">
              {bulkPreviewStaff.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs"
                >
                  <span className="font-bold text-slate-900">
                    {emp.name} ({emp.empCode})
                  </span>
                  <span className="text-slate-500 text-[11px] font-semibold">{emp.department}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={bulkSaving}
            >
              {bulkSaving ? "Assigning..." : "Confirm Bulk Assignment"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: VIEW WEEKLY OFF DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingAssignment)}
        onClose={() => setViewingAssignment(null)}
        title="Weekly Off Schedule Details"
        icon={<CalendarOff className="h-5 w-5 text-emerald-700" />}
        footer={
          viewingAssignment ? (
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  void handleRemoveAssignment(viewingAssignment.id, viewingAssignment.employeeName)
                }
                className="rounded-xl text-xs font-bold text-rose-700 border-rose-200 hover:bg-rose-50"
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenSingleAssign(viewingAssignment)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
              >
                <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit Rest Day Schedule
              </Button>
            </div>
          ) : undefined
        }
      >
        {viewingAssignment && (
          <>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{viewingAssignment.employeeName}</h4>
                <span className="font-mono text-xs font-bold text-slate-600">{viewingAssignment.employeeId}</span>
              </div>
              <p className="text-xs text-slate-500">
                {viewingAssignment.designation} •{" "}
                <span className="text-emerald-700 font-semibold">{viewingAssignment.department}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Assignment Type</span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {viewingAssignment.type} Schedule
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {viewingAssignment.days.map((day) => (
                  <span key={day} className="px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-2xs">
                    🌴 Every {day}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Effective Date Range</span>
                <span className="font-bold text-slate-800">
                  {viewingAssignment.effectiveFrom} → {viewingAssignment.effectiveTo}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Attendance Overtime Rule</span>
                <span className="font-bold text-emerald-700">2.0x OT or Comp-Off</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assigned By</span>
                <span className="font-semibold text-slate-800">{viewingAssignment.assignedBy}</span>
              </div>
            </div>
          </>
        )}
      </Drawer>
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleWeeklyOffExport}
        defaultDate={new Date().toLocaleDateString("en-CA")}
        title="Export weekly off schedule"
        description="Choose file type and time period. Current filters apply to the export."
        exporting={exporting}
      />
    </ModulePageShell>
  );
}
