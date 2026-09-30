"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Clock,
  Search,
  Edit2,
  Plus,
  Printer,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { AttendanceStatsCards } from "@/components/hr/shared/AttendanceStatsCards";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { ReportExportModal } from "@/components/shared/ReportExportModal";
import {
  ToolbarFilterGroup,
  ToolbarFilterSelect,
} from "@/components/shared/list-table";
import { employeeDepartmentFilterOptions } from "@/app/data/hr/employeeDepartmentOptions";
import {
  buildAttendanceExportRows,
  exportAttendanceReport,
  filterAttendanceForExport,
} from "@/lib/hr/attendance-export";
import { hrAttendanceService, hrEmployeeService, hrHolidayService } from "@/services/human-resources";
import { mapAttendanceFromApi, mapEmployeeFromApi, buildPunchTimestamp } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

const attendanceShiftFilterOptions = [
  { value: "ALL", label: "All shifts" },
  { value: "MS", label: "Morning shift" },
  { value: "ES", label: "Evening shift" },
  { value: "NS", label: "Night shift" },
  { value: "GS", label: "General shift" },
] as const;

const attendanceStatusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "Present", label: "Present" },
  { value: "Late", label: "Late" },
  { value: "Absent", label: "Absent" },
  { value: "Pending", label: "Pending" },
  { value: "On Leave", label: "On leave" },
  { value: "Holiday", label: "Holiday" },
  { value: "Weekly Off", label: "Weekly off" },
] as const;

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  shiftId?: string;
  shiftCode: string;
  shiftName: string;
  date: string;
  dayType?: "WORKING_DAY" | "HOLIDAY" | "WEEKLY_OFF";
  checkIn: string;
  checkOut: string;
  scheduledHours?: number;
  workedHours: number;
  extraHours?: number;
  expectedHours: number;
  status: "Present" | "Late" | "Absent" | "Half Day" | "On Leave" | "Weekly Off" | "Holiday" | "Pending";
  deviceType: "Manual Entry";
  isManualEntry?: boolean;
  manualReason?: string;
  source?: "BIOMETRIC" | "MANUAL" | "IMPORT";
  holidayWorked?: boolean;
  leaveRequestId?: string;
  holidayId?: string;
  holidayName?: string | null;
  leaveTypeName?: string | null;
}

function dayTypeLabel(dayType?: AttendanceRecord["dayType"]): string {
  switch (dayType) {
    case "HOLIDAY":
      return "Holiday";
    case "WEEKLY_OFF":
      return "Weekly Off";
    default:
      return "Working Day";
  }
}

function sameCalendarDate(formatted: string, iso: string): boolean {
  try {
    const fromIso = new Date(`${iso}T00:00:00`);
    const fromFormatted = formatted.includes("/")
      ? new Date(`${formatted.split("/").reverse().join("-")}T00:00:00`)
      : new Date(`${formatted}T00:00:00`);
    return fromIso.toDateString() === fromFormatted.toDateString();
  } catch {
    return formatted === iso;
  }
}

function currentTime12h(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function todayIsoDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  return date.toLocaleDateString("en-CA");
}

function isPastIsoDate(iso: string): boolean {
  return iso < todayIsoDate();
}

function clampToToday(iso: string): string {
  const today = todayIsoDate();
  return iso > today ? today : iso;
}

export function AttendanceView() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [activeHoliday, setActiveHoliday] = useState<{ name: string; category: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate);

  const loadAttendance = async (date = selectedDate) => {
    try {
      const [recordRows, empRows, holidays] = await Promise.all([
        hrAttendanceService.getDaily(date).catch(() => []),
        hrEmployeeService.list().catch(() => []),
        hrHolidayService.list().catch(() => []),
      ]);
      const emps = empRows.map(mapEmployeeFromApi);
      setEmployees(emps);
      const lookup = new Map(emps.map((e) => [e.id, e]));
      setRecords(
        recordRows.map((row) =>
          mapAttendanceFromApi(row, lookup.get(String(row.employeeId))),
        ),
      );
      if (emps[0]) setPunchEmpId(emps[0].id);

      // Detect holiday for selected date
      const matchedHoliday = holidays.find((h) => {
        const rawDate = String((h as Record<string, unknown>).holidayDate || (h as Record<string, unknown>).holiday_date || "").trim();
        let iso = "";
        if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
          iso = rawDate.slice(0, 10);
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(rawDate)) {
          const [d, m, y] = rawDate.split("/");
          iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
        return iso === date && String((h as Record<string, unknown>).status ?? "Active").toLowerCase() !== "inactive";
      });

      if (matchedHoliday) {
        setActiveHoliday({
          name: String((matchedHoliday as Record<string, unknown>).holidayName || (matchedHoliday as Record<string, unknown>).name || "Holiday"),
          category: String((matchedHoliday as Record<string, unknown>).category || "Public Holiday"),
        });
      } else {
        setActiveHoliday(null);
      }
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load attendance");
      setRecords([]);
      setEmployees([]);
      setActiveHoliday(null);
    }
  };

  useEffect(() => {
    void loadAttendance(selectedDate);
  }, [selectedDate]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals & Side Drawer State
  const [isManualPunchModalOpen, setIsManualPunchModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<AttendanceRecord | null>(null);

  // Manual Punch Form State
  const [punchEmpId, setPunchEmpId] = useState("EMP-0101");
  const [punchDate, setPunchDate] = useState(todayIsoDate);
  const [punchInTime, setPunchInTime] = useState("09:00 AM");
  const [punchOutTime, setPunchOutTime] = useState("");
  const [punchStatus, setPunchStatus] = useState<"Present" | "Late" | "Half Day">("Present");
  const [punchReason, setPunchReason] = useState("");
  const [savingPunch, setSavingPunch] = useState<"in" | "out" | null>(null);

  const findAttendanceRecord = (empId: string, date: string) =>
    records.find((r) => r.employeeId === empId && sameCalendarDate(r.date, date));

  const modalExistingRecord = useMemo(
    () => findAttendanceRecord(punchEmpId, punchDate),
    [records, punchEmpId, punchDate],
  );

  const hasPunchedIn =
    Boolean(modalExistingRecord?.checkIn && modalExistingRecord.checkIn !== "—");
  const hasPunchedOut =
    Boolean(modalExistingRecord?.checkOut && modalExistingRecord.checkOut !== "—");
  const isPastDate = isPastIsoDate(punchDate);
  const canEnterPunchOut = isPastDate || hasPunchedIn;
  const today = todayIsoDate();
  const isAtToday = selectedDate >= today;

  const openManualPunchModal = (empId?: string) => {
    const targetEmpId = empId ?? punchEmpId;
    if (empId) setPunchEmpId(empId);
    setPunchDate(selectedDate);
    const existing = findAttendanceRecord(targetEmpId, selectedDate);
    setPunchInTime(existing?.checkIn && existing.checkIn !== "—" ? existing.checkIn : currentTime12h());
    setPunchOutTime(existing?.checkOut && existing.checkOut !== "—" ? existing.checkOut : "");
    if (existing?.status === "Present" || existing?.status === "Late" || existing?.status === "Half Day") {
      setPunchStatus(existing.status);
    } else {
      setPunchStatus("Present");
    }
    setPunchReason(existing?.manualReason ?? "");
    setIsManualPunchModalOpen(true);
  };

  useEffect(() => {
    if (!isManualPunchModalOpen) return;
    const existing = findAttendanceRecord(punchEmpId, punchDate);
    if (existing?.checkIn && existing.checkIn !== "—") setPunchInTime(existing.checkIn);
    setPunchOutTime(existing?.checkOut && existing.checkOut !== "—" ? existing.checkOut : "");
  }, [isManualPunchModalOpen, punchEmpId, punchDate]);

  const employeeLookup = useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  );

  const dateScopedRecords = useMemo(() => {
    const forDate = records.filter((r) => sameCalendarDate(r.date, selectedDate));
    const byEmployee = new Map<string, AttendanceRecord>();
    for (const record of forDate) {
      const existing = byEmployee.get(record.employeeId);
      if (
        !existing ||
        record.workedHours > existing.workedHours ||
        (record.checkOut !== "—" && existing.checkOut === "—")
      ) {
        byEmployee.set(record.employeeId, record);
      }
    }

    // Ensure all active employees are represented for selected date
    for (const emp of employees) {
      if (!byEmployee.has(emp.id)) {
        const isFuture = selectedDate > todayIsoDate();
        byEmployee.set(emp.id, {
          id: `pending-${emp.id}-${selectedDate}`,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          designation: emp.designation,
          avatar: emp.avatar,
          photoUrl: emp.photoUrl,
          shiftCode: emp.shiftType ? emp.shiftType.slice(0, 3).toUpperCase() : "GEN",
          shiftName: emp.shiftType || "General Shift",
          date: selectedDate,
          checkIn: "—",
          checkOut: "—",
          workedHours: 0,
          expectedHours: 8,
          status: isFuture ? "Pending" : activeHoliday ? "Holiday" : "Pending",
          deviceType: "Manual Entry",
          source: "MANUAL",
        });
      }
    }

    return Array.from(byEmployee.values());
  }, [records, employees, selectedDate, activeHoliday]);

  const filteredRecords = useMemo(() => {
    return dateScopedRecords.filter((r) => {
      const empCode = employeeLookup.get(r.employeeId)?.empCode ?? "";
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.shiftName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || r.department === selectedDepartment;
      const matchShift = selectedShift === "ALL" || r.shiftCode.startsWith(selectedShift);
      const matchStatus =
        selectedStatus === "ALL" ||
        r.status === selectedStatus ||
        (selectedStatus === "On Leave" &&
          (r.status === "On Leave" || r.status === "Weekly Off" || r.status === "Holiday"));

      return matchSearch && matchDept && matchShift && matchStatus;
    });
  }, [
    dateScopedRecords,
    employeeLookup,
    searchTerm,
    selectedDepartment,
    selectedShift,
    selectedStatus,
  ]);

  // KPI Metrics (selected date only)
  const metrics = useMemo(() => {
    const present = dateScopedRecords.filter((r) => r.status === "Present").length;
    const late = dateScopedRecords.filter((r) => r.status === "Late").length;
    const absent = dateScopedRecords.filter((r) => r.status === "Absent").length;
    const pending = dateScopedRecords.filter((r) => r.status === "Pending").length;
    const onLeave = dateScopedRecords.filter(
      (r) => r.status === "On Leave" || r.status === "Weekly Off" || r.status === "Holiday",
    ).length;
    return { present, late, absent, pending, onLeave };
  }, [dateScopedRecords]);

  const handleStatFilter = (status: string) => {
    setSelectedStatus((prev) => (prev === status ? "ALL" : status));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("ALL");
    setSelectedShift("ALL");
    setSelectedStatus("ALL");
    setSelectedDate(todayIsoDate());
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedDepartment !== "ALL" ||
    selectedShift !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedDate !== todayIsoDate();

  const handleAttendanceExport = async (options: {
    format: "csv" | "excel" | "pdf";
    period: "day" | "week" | "month" | "custom";
    fromDate: string;
    toDate: string;
  }) => {
    setExporting(true);
    try {
      const rows = await hrAttendanceService.listRange(options.fromDate, options.toDate);
      const mapped = rows.map((row) =>
        mapAttendanceFromApi(row, employeeLookup.get(String(row.employeeId))),
      );
      const filtered = filterAttendanceForExport(mapped, employeeLookup, {
        searchTerm,
        department: selectedDepartment,
        shift: selectedShift,
        status: selectedStatus,
      });
      const exportRows = buildAttendanceExportRows(filtered, employeeLookup);
      exportAttendanceReport(exportRows, options);
      setToastMessage(`Exported ${exportRows.length} attendance record(s).`);
      setIsExportModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handlePunchIn = async () => {
    const empObj = employees.find((x) => x.id === punchEmpId);
    const empName = empObj?.name || "Employee";
    const existing = findAttendanceRecord(punchEmpId, punchDate);
    const reason = punchReason || "Manual punch-in recorded by HR.";

    if (!punchInTime.trim()) {
      setToastMessage("Enter punch-in time.");
      return;
    }

    const punchInIso = buildPunchTimestamp(punchDate, punchInTime);
    if (!punchInIso) {
      setToastMessage("Invalid punch-in time format.");
      return;
    }

    const pastCheckOut = isPastIsoDate(punchDate) && punchOutTime.trim() ? punchOutTime : null;
    const punchOutIso = pastCheckOut ? buildPunchTimestamp(punchDate, pastCheckOut) : null;

    if (pastCheckOut && !punchOutIso) {
      setToastMessage("Invalid punch-out time format.");
      return;
    }

    setSavingPunch("in");
    try {
      if (existing?.id && (existing.checkIn !== "—" || pastCheckOut)) {
        await hrAttendanceService.correct(existing.id, {
          punchIn: punchInIso,
          punchOut: punchOutIso,
          overrideReason: reason,
          remarks: reason,
        });
      } else {
        await hrAttendanceService.punchIn({
          employeeId: punchEmpId,
          attendanceDate: punchDate,
          punchInAt: punchInIso,
          source: "MANUAL",
          remarks: reason,
        });
        if (punchOutIso) {
          await hrAttendanceService.punchOut({
            employeeId: punchEmpId,
            attendanceDate: punchDate,
            punchOutAt: punchOutIso,
            source: "MANUAL",
            remarks: reason,
          });
        }
      }

      await loadAttendance(selectedDate);
      if (pastCheckOut) {
        setIsManualPunchModalOpen(false);
        setToastMessage(`Attendance saved for ${empName}.`);
      } else {
        setToastMessage(`Punch-in recorded at ${punchInTime} for ${empName}.`);
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to record punch-in");
    } finally {
      setSavingPunch(null);
    }
  };

  const handlePunchOut = async () => {
    const empObj = employees.find((x) => x.id === punchEmpId);
    const empName = empObj?.name || "Employee";
    const existing = findAttendanceRecord(punchEmpId, punchDate);
    const reason = punchReason || "Manual punch-out recorded by HR.";

    if (!isPastIsoDate(punchDate) && !hasPunchedIn) {
      setToastMessage("Employee must punch in first.");
      return;
    }

    if (!punchOutTime.trim()) {
      setToastMessage("Enter punch-out time.");
      return;
    }

    const punchOutIso = buildPunchTimestamp(punchDate, punchOutTime);
    if (!punchOutIso) {
      setToastMessage("Invalid punch-out time format.");
      return;
    }

    setSavingPunch("out");
    try {
      if (existing?.id && existing.checkIn === "—" && punchInTime.trim()) {
        const punchInIso = buildPunchTimestamp(punchDate, punchInTime);
        if (!punchInIso) {
          setToastMessage("Invalid punch-in time format.");
          return;
        }
        await hrAttendanceService.correct(existing.id, {
          punchIn: punchInIso,
          punchOut: punchOutIso,
          overrideReason: reason,
          remarks: reason,
        });
      } else {
        await hrAttendanceService.punchOut({
          employeeId: punchEmpId,
          attendanceDate: punchDate,
          punchOutAt: punchOutIso,
          source: "MANUAL",
          remarks: reason,
        });
      }

      await loadAttendance(selectedDate);
      setIsManualPunchModalOpen(false);
      setToastMessage(`Punch-out recorded at ${punchOutTime} for ${empName}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to record punch-out");
    } finally {
      setSavingPunch(null);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Attendance & Leave"
      title="Attendance Management"
      description="Record and review daily employee attendance via manual punch-in/out and shift compliance."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Attendance & Leave" },
        { label: "Attendance" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Working Manual Punch Button */}
          <Button
            type="button"
            size="sm"
            onClick={() => openManualPunchModal()}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Punch-In / Out
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      <AttendanceStatsCards
        metrics={metrics}
        onFilterStatus={handleStatFilter}
        activeStatus={selectedStatus === "ALL" ? undefined : selectedStatus}
      />

      {activeHoliday && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white text-lg shadow-sm">
              🎉
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-violet-950">{activeHoliday.name}</h4>
                <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-800 border border-violet-200">
                  {activeHoliday.category}
                </span>
              </div>
              <p className="text-xs text-violet-700">
                Official holiday for selected date ({selectedDate}). Non-duty punches are marked as Holiday.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs">
            Public Holiday
          </span>
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-8 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden sm:contents">
              <ToolbarFilterGroup>
                <ToolbarFilterSelect
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  options={[...employeeDepartmentFilterOptions]}
                  ariaLabel="Filter by department"
                />
                <ToolbarFilterSelect
                  value={selectedShift}
                  onChange={setSelectedShift}
                  options={[...attendanceShiftFilterOptions]}
                  ariaLabel="Filter by shift"
                />
                <ToolbarFilterSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={[...attendanceStatusFilterOptions]}
                  ariaLabel="Filter by status"
                />
              </ToolbarFilterGroup>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedDate((d) => shiftIsoDate(d, -1))}
                aria-label="Previous day"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(clampToToday(e.target.value))}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />

              <button
                type="button"
                onClick={() => setSelectedDate((d) => clampToToday(shiftIsoDate(d, 1)))}
                disabled={isAtToday}
                aria-label="Next day"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="hidden text-xs font-bold text-emerald-700 hover:underline sm:inline"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 sm:hidden"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Day Type</th>
                <th className="py-3 px-4">Punch In</th>
                <th className="py-3 px-4">Punch Out</th>
                <th className="py-3 px-4">Worked</th>
                <th className="py-3 px-4">Extra</th>
                <th className="py-3 px-4">Holiday / Leave</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/80 transition cursor-pointer"
                  onClick={() => setViewingRecord(r)}
                >
                  <td className="py-3 px-4">
                    <HREmployeeCell
                      name={r.employeeName}
                      id={employeeLookup.get(r.employeeId)?.empCode ?? "—"}
                      avatar={r.avatar}
                      photoUrl={r.photoUrl}
                    />
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-800">{r.department}</p>
                    <p className="text-[10px] text-slate-500">{r.designation}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {r.shiftName}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700">{dayTypeLabel(r.dayType)}</td>

                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">{r.checkIn}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.checkOut}</td>
                  <td className="py-3 px-4 font-black text-slate-900">{r.workedHours}h</td>
                  <td className="py-3 px-4 font-bold text-amber-800">{r.extraHours ?? 0}h</td>
                  <td className="py-3 px-4 text-[11px] text-slate-600">
                    {r.holidayName ? r.holidayName : r.leaveTypeName ? r.leaveTypeName : "—"}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.map((r) => (
          <div
            key={r.id}
            onClick={() => setViewingRecord(r)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <HREmployeeCell
                name={r.employeeName}
                id={employeeLookup.get(r.employeeId)?.empCode ?? "—"}
                avatar={r.avatar}
                photoUrl={r.photoUrl}
              />
              <StatusBadge status={r.status} />
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block">Punch In / Out</span>
                <span className="font-bold text-slate-900">{r.checkIn} → {r.checkOut}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Worked Duration</span>
                <span className="font-black text-emerald-800 text-sm">{r.workedHours} Hours</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingRecord(r);
                }}
                className="flex-1 text-xs"
              >
                View
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openManualPunchModal(r.employeeId);
                }}
                className="flex-1 bg-emerald-700 text-white text-xs font-bold"
              >
                Manual Punch
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: MANUAL PUNCH-IN / PUNCH-OUT MODAL (Functioning)
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isManualPunchModalOpen}
        onClose={() => setIsManualPunchModalOpen(false)}
        title="Manual Punch-In / Punch-Out"
        description={
          isPastDate
            ? "For past dates, enter both punch-in and punch-out times together."
            : "Punch in to create today's record. Punch out at end of day to complete it."
        }
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Employee <span className="text-rose-500">*</span>
              </label>
              <select
                value={punchEmpId}
                onChange={(e) => setPunchEmpId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                {employees.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} — {staff.department}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Date</label>
              <input
                type="date"
                value={punchDate}
                max={today}
                onChange={(e) => setPunchDate(clampToToday(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium"
              />
            </div>
          </div>

          {!isPastDate && (hasPunchedIn || hasPunchedOut) && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {hasPunchedOut
                ? "Attendance complete for today. You can update punch-out time below."
                : `Punched in at ${modalExistingRecord?.checkIn}. Add punch-out at end of day.`}
            </div>
          )}

          {isPastDate && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              Past date selected — enter both punch-in and punch-out times, then save.
            </div>
          )}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-3">
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Punch In</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Punch-In Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={punchInTime}
                  onChange={(e) => setPunchInTime(e.target.value)}
                  placeholder="e.g. 09:00 AM"
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Status</label>
                <select
                  value={punchStatus}
                  onChange={(e) => setPunchStatus(e.target.value as "Present" | "Late" | "Half Day")}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              disabled={savingPunch !== null}
              onClick={() => void handlePunchIn()}
              className="w-full rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              <LogIn className="mr-1.5 h-3.5 w-3.5" />
              {savingPunch === "in" ? "Saving..." : hasPunchedIn ? "Update Punch In" : "Record Punch In"}
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Punch Out</p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Punch-Out Time</label>
              <input
                type="text"
                value={punchOutTime}
                onChange={(e) => setPunchOutTime(e.target.value)}
                placeholder="e.g. 05:30 PM"
                disabled={!canEnterPunchOut}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-mono font-bold disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <Button
              type="button"
              size="sm"
              disabled={savingPunch !== null || !canEnterPunchOut}
              onClick={() => void handlePunchOut()}
              className="w-full rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-50"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              {savingPunch === "out"
                ? "Saving..."
                : isPastDate
                  ? "Save Attendance"
                  : hasPunchedOut
                    ? "Update Punch Out"
                    : "Record Punch Out"}
            </Button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Reason (optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Forgot to punch / delayed due to emergency..."
              value={punchReason}
              onChange={(e) => setPunchReason(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsManualPunchModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: VIEW ATTENDANCE DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Attendance Punch Log Audit"
        icon={<Clock className="h-5 w-5 text-emerald-700" />}
      >
        {viewingRecord && (
          <>
            <HREmployeeCell
              name={viewingRecord.employeeName}
              id={employeeLookup.get(viewingRecord.employeeId)?.empCode ?? "—"}
              avatar={viewingRecord.avatar}
              photoUrl={viewingRecord.photoUrl}
              department={viewingRecord.department}
              designation={viewingRecord.designation}
            />

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Shift</span>
                <span className="font-bold text-slate-900">{viewingRecord.shiftName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Day Type</span>
                <span className="font-bold text-slate-900">{dayTypeLabel(viewingRecord.dayType)}</span>
              </div>
              {(viewingRecord.holidayName || viewingRecord.leaveTypeName) && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-500 font-medium">
                    {viewingRecord.holidayName ? "Holiday" : "Leave"}
                  </span>
                  <span className="font-bold text-slate-900">
                    {viewingRecord.holidayName ?? viewingRecord.leaveTypeName}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Punch In</span>
                  <span className="font-extrabold text-emerald-800 text-sm">{viewingRecord.checkIn}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Punch Out</span>
                  <span className="font-extrabold text-slate-900 text-sm">{viewingRecord.checkOut}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Scheduled</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingRecord.scheduledHours ?? 0}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Worked</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingRecord.workedHours}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Extra Hours</span>
                  <span className="font-bold text-amber-800 text-sm">{viewingRecord.extraHours ?? 0}h</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Source</span>
                  <span className="font-bold text-slate-800 text-sm">{viewingRecord.source ?? "MANUAL"}</span>
                </div>
              </div>
            </div>

            {(viewingRecord.isManualEntry || viewingRecord.manualReason) && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
                <span className="font-bold text-amber-900 uppercase block">Manual Override</span>
                <p className="italic text-amber-900">
                  &ldquo;{viewingRecord.manualReason || "Manual punch recorded by HR."}&rdquo;
                </p>
              </div>
            )}

            {/* Edit Button Inside Detail View Drawer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const targetEmpId = viewingRecord.employeeId;
                  setViewingRecord(null);
                  openManualPunchModal(targetEmpId);
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Punch Record</span>
              </Button>
            </div>
          </>
        )}
      </Drawer>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Attendance Records"
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <ToolbarFilterSelect
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              options={[...employeeDepartmentFilterOptions]}
              ariaLabel="Filter by department"
              className="w-full min-w-0"
            />
            <ToolbarFilterSelect
              value={selectedShift}
              onChange={setSelectedShift}
              options={[...attendanceShiftFilterOptions]}
              ariaLabel="Filter by shift"
              className="w-full min-w-0"
            />
            <ToolbarFilterSelect
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[...attendanceStatusFilterOptions]}
              ariaLabel="Filter by status"
              className="w-full min-w-0"
            />
            <div>
              <label className="mb-1 block font-bold text-slate-700">Date</label>
              <input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(clampToToday(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 font-semibold"
              />
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 rounded-xl text-xs font-bold"
                >
                  Reset
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 rounded-xl bg-emerald-700 text-xs font-bold text-white"
              >
                Apply
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleAttendanceExport}
        defaultDate={selectedDate}
        maxDate={today}
        title="Export attendance report"
        description="Choose file type and time period. Current table filters will apply to the export."
        exporting={exporting}
      />
    </ModulePageShell>
  );
}
