"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CalendarRange,
  Search,
  Plus,
  SlidersHorizontal,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Power,
  Trash2,
  Calendar,
  Sparkles,
  Gift,
  Building2,
  Coins,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { FODatePicker } from "@/components/frontoffice/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrHolidayService } from "@/services/human-resources";
import { mapHolidayFromApi, mapHolidayToApi } from "@/lib/hr/api-mappers";
import { cn } from "@/lib/utils";

export type HolidayStatus = "Active" | "Inactive";
export type HolidayCategory = "National" | "Festival" | "Regional" | "Company Optional";

export interface HolidayMaster {
  id: string;
  holidayCode: string;
  holidayName: string;
  holidayDate: string; // DD/MM/YYYY
  dayOfWeek: string;
  category: HolidayCategory;
  isMandatory: boolean;
  extraPayMultiplier: number; // e.g. 2.0x for double pay
  applicableDepartments: string; // "All Departments" or specific
  description: string;
  status: HolidayStatus;
  year: string;
}

export function computeDayOfWeek(dateStr: string): string {
  if (!dateStr) return "";
  let d: Date | null = null;
  const trimmed = dateStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("/").map(Number);
    d = new Date(year, month - 1, day);
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split("-").map(Number);
    d = new Date(year, month - 1, day);
  } else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(trimmed);
  }

  if (d && !isNaN(d.getTime())) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[d.getDay()];
  }
  return "";
}

function displayToIso(display: string): string {
  const trimmed = display.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return trimmed;
}

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function enumerateIsoDates(fromIso: string, toIso: string): string[] {
  const start = new Date(`${fromIso}T12:00:00`);
  const end = new Date(`${toIso}T12:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [fromIso];
  const rangeStart = start <= end ? start : end;
  const rangeEnd = start <= end ? end : start;
  const dates: string[] = [];
  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return dates;
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
        {description && <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function HolidayCalendarMasterView() {
  const [holidays, setHolidays] = useState<HolidayMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadHolidays = async () => {
    try {
      const rows = await hrHolidayService.list();
      setHolidays(rows.map(mapHolidayFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load holidays");
      setHolidays([]);
    }
  };

  useEffect(() => {
    void loadHolidays();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("2026");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayMaster | null>(null);
  const [viewingHoliday, setViewingHoliday] = useState<HolidayMaster | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDateFrom, setFormDateFrom] = useState("2026-08-15");
  const [formDateTo, setFormDateTo] = useState("2026-08-15");
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [formCategory, setFormCategory] = useState<HolidayCategory>("National");
  const [formIsMandatory, setFormIsMandatory] = useState(true);
  const [formMultiplier, setFormMultiplier] = useState(2.0);
  const [formDepts, setFormDepts] = useState("All Departments");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<HolidayStatus>("Active");
  const [formYear, setFormYear] = useState("2026");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [dateError, setDateError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = holidays.length;
    const national = holidays.filter((h) => h.category === "National").length;
    const festival = holidays.filter((h) => h.category === "Festival").length;
    const doublePayHolidays = holidays.filter((h) => h.extraPayMultiplier >= 2.0).length;
    return { total, national, festival, doublePayHolidays };
  }, [holidays]);

  // Filtered List
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const matchSearch =
        h.holidayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.holidayCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "ALL" || h.category === categoryFilter;
      const matchYear = yearFilter === "ALL" || h.year === yearFilter;
      const matchStatus = statusFilter === "ALL" || h.status === statusFilter;

      return matchSearch && matchCategory && matchYear && matchStatus;
    });
  }, [holidays, searchTerm, categoryFilter, yearFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingHoliday(null);
    setFormCode(`HOL-${formYear}-${Math.floor(10 + Math.random() * 90)}`);
    setFormName("");
    setFormDateFrom("2026-08-15");
    setFormDateTo("2026-08-15");
    setIsMultiDay(false);
    setFormCategory("National");
    setFormIsMandatory(true);
    setFormMultiplier(2.0);
    setFormDepts("All Departments");
    setFormDescription("");
    setFormStatus("Active");
    setFormYear("2026");
    setNameError("");
    setCodeError("");
    setDateError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (h: HolidayMaster) => {
    const iso = displayToIso(h.holidayDate);
    setEditingHoliday(h);
    setFormCode(h.holidayCode);
    setFormName(h.holidayName);
    setFormDateFrom(iso);
    setFormDateTo(iso);
    setIsMultiDay(false);
    setFormCategory(h.category);
    setFormIsMandatory(h.isMandatory);
    setFormMultiplier(h.extraPayMultiplier);
    setFormDepts(h.applicableDepartments);
    setFormDescription(h.description);
    setFormStatus(h.status);
    setFormYear(h.year);
    setNameError("");
    setCodeError("");
    setDateError("");
    setIsModalOpen(true);
  };

  const buildHolidayPayload = (isoDate: string, code: string) =>
    mapHolidayToApi({
      holidayCode: code,
      holidayName: formName.trim(),
      holidayDate: isoToDisplay(isoDate),
      dayOfWeek: "",
      category: formCategory,
      isMandatory: formIsMandatory,
      extraPayMultiplier: Number(formMultiplier),
      applicableDepartments: formDepts,
      description: formDescription.trim(),
      status: formStatus,
      year: isoDate.slice(0, 4) || formYear,
    });

  // Save Holiday (Duplicate check)
  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setCodeError("");
    setDateError("");

    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim();
    const toDate = isMultiDay ? formDateTo : formDateFrom;
    const dateList = enumerateIsoDates(formDateFrom, toDate);

    if (!trimmedName) {
      setNameError("Holiday Name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Holiday Code is required.");
      return;
    }

    if (!formDateFrom || dateList.length === 0) {
      setDateError("Please select a valid holiday date.");
      return;
    }

    if (isMultiDay && new Date(`${formDateTo}T12:00:00`) < new Date(`${formDateFrom}T12:00:00`)) {
      setDateError("End date cannot be before start date.");
      return;
    }

    const isDuplicate = holidays.some(
      (h) =>
        h.holidayName.toLowerCase() === trimmedName.toLowerCase() &&
        h.year === formYear &&
        (!editingHoliday || h.id !== editingHoliday.id),
    );

    if (isDuplicate && !isMultiDay) {
      setNameError(`Holiday "${trimmedName}" is already listed for year ${formYear}.`);
      return;
    }

    try {
      if (editingHoliday) {
        await hrHolidayService.update(
          editingHoliday.id,
          buildHolidayPayload(formDateFrom, trimmedCode),
        );
        setToastMessage(`Updated holiday "${trimmedName}".`);
      } else {
        for (let i = 0; i < dateList.length; i++) {
          const iso = dateList[i];
          const suffix = dateList.length > 1 ? `-${iso.slice(8, 10)}${iso.slice(5, 7)}` : "";
          const code =
            dateList.length > 1 ? `${trimmedCode}${suffix}` : trimmedCode;
          await hrHolidayService.create(buildHolidayPayload(iso, code));
        }
        setToastMessage(
          dateList.length > 1
            ? `Created ${dateList.length} holiday entries for "${trimmedName}".`
            : `Created holiday "${trimmedName}".`,
        );
      }
      await loadHolidays();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save holiday");
    }
  };

  const handleToggleStatus = async (h: HolidayMaster) => {
    const nextStatus: HolidayStatus = h.status === "Active" ? "Inactive" : "Active";
    try {
      await hrHolidayService.update(h.id, { status: nextStatus });
      await loadHolidays();
      setToastMessage(`Holiday "${h.holidayName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteHoliday = async (h: HolidayMaster) => {
    if (confirm(`Are you sure you want to delete holiday "${h.holidayName}"?`)) {
      try {
        await hrHolidayService.remove(h.id);
        if (viewingHoliday?.id === h.id) setViewingHoliday(null);
        await loadHolidays();
        setToastMessage(`Deleted holiday "${h.holidayName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete holiday");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Holiday Calendar"
      description="Configure annual national and festival holiday calendars, holiday extra pay multipliers, and mandatory duty rules."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Holiday Calendar" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenCreateModal}
          className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Holiday
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Holidays"
          value={`${stats.total}`}
          subtitle="Calendar Year 2026"
          tone="blue"
          icon={<CalendarRange className="h-5 w-5" />}
        />
        <HRKPICard
          label="National Holidays"
          value={`${stats.national}`}
          subtitle="Statutory Mandatory"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Festival Holidays"
          value={`${stats.festival}`}
          subtitle="Festive Occasions"
          tone="purple"
          icon={<Gift className="h-5 w-5" />}
        />
        <HRKPICard
          label="Double Pay (2.0x)"
          value={`${stats.doublePayHolidays}`}
          subtitle="Working Staff Premium"
          tone="amber"
          icon={<Coins className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Holiday Name or Code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-extrabold text-slate-800"
              >
                <option value="2026">2026 Calendar</option>
                <option value="2025">2025 Calendar</option>
                <option value="ALL">All Years</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Categories</option>
                <option value="National">National Public</option>
                <option value="Festival">Festival</option>
                <option value="Regional">Regional</option>
                <option value="Company Optional">Company Optional</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">🟢 Active</option>
                <option value="Inactive">⚪ Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("ALL");
                  setYearFilter("2026");
                  setStatusFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="sm:hidden px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: DATA TABLE (DESKTOP) & STACKED CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Holiday Name</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Extra Duty Pay Multiplier</th>
                <th className="py-3.5 px-4">Mandatory Holiday</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHolidays.length > 0 ? (
                filteredHolidays.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingHoliday(h)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs">
                          <Gift className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{h.holidayName}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{h.holidayCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">📅 {h.holidayDate}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {h.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
                        💰 {h.extraPayMultiplier}x Salary Rate
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {h.isMandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                          Mandatory Public Holiday
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Optional / Restricted</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={h.status} />
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingHoliday(h)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(h)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(h)}
                          className={`rounded-xl text-xs font-semibold ${
                            h.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {h.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteHoliday(h)}
                          className="rounded-xl text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No holidays found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredHolidays.map((h) => (
          <div
            key={h.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingHoliday(h)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{h.holidayCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{h.holidayName}</h4>
              </div>
              <StatusBadge status={h.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-900 font-bold">Date: {h.holidayDate}</p>
              <p className="text-slate-500">Category: {h.category}</p>
              <p className="text-slate-500">Working Staff Extra Pay: <strong>{h.extraPayMultiplier}x Multiplier</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(h)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(h)}
                className="text-xs font-semibold"
              >
                {h.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteHoliday(h)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT HOLIDAY
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingHoliday ? "Edit Holiday" : "Add Holiday"}
          description="Set holiday dates using the calendar, configure category, and duty pay rules."
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveHoliday} className="space-y-4 text-xs">
            <FormSection title="Holiday details">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Holiday Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HOL-2026-01"
                    value={formCode}
                    onChange={(e) => {
                      setFormCode(e.target.value);
                      setCodeError("");
                    }}
                    className={cn(
                      "w-full rounded-xl border bg-white px-3 py-2.5 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2",
                      codeError
                        ? "border-rose-400 focus:ring-rose-500"
                        : "border-slate-200 focus:ring-emerald-600",
                    )}
                  />
                  {codeError && (
                    <p className="pt-1 text-[11px] font-semibold text-rose-600">{codeError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Holiday Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Republic Day"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setNameError("");
                    }}
                    className={cn(
                      "w-full rounded-xl border bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2",
                      nameError
                        ? "border-rose-400 focus:ring-rose-500"
                        : "border-slate-200 focus:ring-emerald-600",
                    )}
                  />
                  {nameError && (
                    <p className="pt-1 text-[11px] font-semibold text-rose-600">{nameError}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as HolidayCategory)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="National">National Public</option>
                    <option value="Festival">Festival</option>
                    <option value="Regional">Regional</option>
                    <option value="Company Optional">Company Optional</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Calendar Year</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Holiday schedule"
              description={
                editingHoliday
                  ? "Pick the holiday date from the calendar."
                  : "Select a single date or enable multi-day to choose a from–to range."
              }
            >
              {!editingHoliday && (
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked);
                      if (!e.target.checked) setFormDateTo(formDateFrom);
                      setDateError("");
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-slate-800">Multi-day holiday (date range)</span>
                </label>
              )}

              <div className={cn("grid gap-3", isMultiDay && !editingHoliday ? "sm:grid-cols-2" : "grid-cols-1")}>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {isMultiDay && !editingHoliday ? "From date" : "Holiday date"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <FODatePicker
                    value={formDateFrom}
                    onChange={(value) => {
                      setFormDateFrom(value);
                      setFormYear(value.slice(0, 4));
                      if (!isMultiDay || editingHoliday) setFormDateTo(value);
                      if (isMultiDay && formDateTo < value) setFormDateTo(value);
                      setDateError("");
                    }}
                    className="w-full"
                    placeholder="Select start date"
                  />
                </div>

                {isMultiDay && !editingHoliday && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      To date <span className="text-rose-500">*</span>
                    </label>
                    <FODatePicker
                      value={formDateTo}
                      onChange={(value) => {
                        setFormDateTo(value);
                        setDateError("");
                      }}
                      className="w-full"
                      placeholder="Select end date"
                    />
                  </div>
                )}
              </div>

              {dateError && (
                <p className="text-[11px] font-semibold text-rose-600">{dateError}</p>
              )}

              {isMultiDay && !editingHoliday && formDateFrom && formDateTo && !dateError && (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
                  {enumerateIsoDates(formDateFrom, formDateTo).length} day(s) will be added to the
                  calendar ({isoToDisplay(formDateFrom)}
                  {formDateFrom !== formDateTo ? ` → ${isoToDisplay(formDateTo)}` : ""}).
                </p>
              )}
            </FormSection>

            <FormSection title="Pay & rules">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Extra duty pay multiplier
                  </label>
                  <select
                    value={formMultiplier}
                    onChange={(e) => setFormMultiplier(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value={2.0}>2.0× Double salary rate</option>
                    <option value={1.5}>1.5× One and a half rate</option>
                    <option value={1.0}>1.0× Normal salary rate</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as HolidayStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                <input
                  type="checkbox"
                  checked={formIsMandatory}
                  onChange={(e) => setFormIsMandatory(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="block text-sm font-semibold text-slate-900">
                    Mandatory public holiday
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Applies mandatory holiday rules to all salaried staff.
                  </span>
                </div>
              </label>
            </FormSection>

            <FormSection title="Notes">
              <textarea
                rows={3}
                placeholder="Holiday occasion details and operations guidelines…"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </FormSection>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
              >
                {editingHoliday ? "Update Holiday" : "Save Holiday"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW HOLIDAY DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingHoliday)}
        onClose={() => setViewingHoliday(null)}
        title="Holiday Master Details"
        icon={<CalendarRange className="h-5 w-5 text-amber-700" />}
      >
        {viewingHoliday && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingHoliday.holidayCode}</span>
              <h3 className="text-base font-black text-amber-400">{viewingHoliday.holidayName}</h3>
              <StatusBadge status={viewingHoliday.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Schedule &amp; Category</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Holiday Date:</span>
                <strong className="text-slate-900">{viewingHoliday.holidayDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Category:</span>
                <strong className="text-slate-900">{viewingHoliday.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Calendar Year:</span>
                <strong className="text-slate-900">{viewingHoliday.year}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="font-extrabold text-emerald-950 block uppercase">Working Duty Extra Pay</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-700 font-medium">Extra Pay Multiplier:</span>
                <strong className="text-emerald-950 text-sm font-black">💰 {viewingHoliday.extraPayMultiplier}x Salary Rate</strong>
              </div>
              <p className="text-[11px] text-slate-500">
                Operational staff working shift on this day will be credited extra payment at {viewingHoliday.extraPayMultiplier}x rate.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Description</span>
              <p className="text-slate-700 leading-relaxed">{viewingHoliday.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Holiday Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Calendar Year</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="2026">2026 Calendar</option>
              <option value="2025">2025 Calendar</option>
              <option value="ALL">All Years</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="National">National Public</option>
              <option value="Festival">Festival</option>
              <option value="Regional">Regional</option>
              <option value="Company Optional">Company Optional</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            className="w-full font-bold bg-emerald-700 text-white rounded-xl"
          >
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </ModulePageShell>
  );
}
