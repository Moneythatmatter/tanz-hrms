"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Clock,
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
  Users,
  Coffee,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrShiftTypeService } from "@/services/human-resources";
import { mapShiftTypeFromApi, mapShiftTypeToApi } from "@/lib/hr/api-mappers";

export type ShiftStatus = "Active" | "Inactive";
export type ShiftCategory = "Morning" | "Afternoon" | "Night" | "General" | "Split";

export interface ShiftTypeMaster {
  id: string;
  shiftCode: string;
  shiftName: string;
  category: ShiftCategory;
  startTime: string;
  endTime: string;
  breakDurationMinutes: number;
  totalWorkingHours: number;
  isNightShift: boolean;
  nightAllowanceEligible: boolean;
  description: string;
  status: ShiftStatus;
  createdDate: string;
  employeeCount: number;
}

export function ShiftTypesMasterView() {
  const [shifts, setShifts] = useState<ShiftTypeMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadShifts = async () => {
    try {
      const rows = await hrShiftTypeService.list();
      setShifts(rows.map(mapShiftTypeFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load shift types");
      setShifts([]);
    }
  };

  useEffect(() => {
    void loadShifts();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftTypeMaster | null>(null);
  const [viewingShift, setViewingShift] = useState<ShiftTypeMaster | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<ShiftCategory>("Morning");
  const [formStartTime, setFormStartTime] = useState("07:00 AM");
  const [formEndTime, setFormEndTime] = useState("03:30 PM");
  const [formBreak, setFormBreak] = useState(30);
  const [formWorkingHours, setFormWorkingHours] = useState(8);
  const [formIsNightShift, setFormIsNightShift] = useState(false);
  const [formNightAllowance, setFormNightAllowance] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ShiftStatus>("Active");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = shifts.length;
    const active = shifts.filter((s) => s.status === "Active").length;
    const nightShifts = shifts.filter((s) => s.isNightShift).length;
    const totalEmployees = shifts.reduce((sum, s) => sum + s.employeeCount, 0);
    return { total, active, nightShifts, totalEmployees };
  }, [shifts]);

  // Filtered List
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchSearch =
        s.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shiftCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "ALL" || s.category === categoryFilter;
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [shifts, searchTerm, categoryFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingShift(null);
    setFormCode(`SHF-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormCategory("Morning");
    setFormStartTime("07:00 AM");
    setFormEndTime("03:30 PM");
    setFormBreak(30);
    setFormWorkingHours(8);
    setFormIsNightShift(false);
    setFormNightAllowance(false);
    setFormDescription("");
    setFormStatus("Active");
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (s: ShiftTypeMaster) => {
    setEditingShift(s);
    setFormCode(s.shiftCode);
    setFormName(s.shiftName);
    setFormCategory(s.category);
    setFormStartTime(s.startTime);
    setFormEndTime(s.endTime);
    setFormBreak(s.breakDurationMinutes);
    setFormWorkingHours(s.totalWorkingHours);
    setFormIsNightShift(s.isNightShift);
    setFormNightAllowance(s.nightAllowanceEligible);
    setFormDescription(s.description);
    setFormStatus(s.status);
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Save Shift Type (Duplicate check)
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setCodeError("");

    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim();

    if (!trimmedName) {
      setNameError("Shift Name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Shift Code is required.");
      return;
    }

    const isDuplicate = shifts.some(
      (s) =>
        s.shiftName.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingShift || s.id !== editingShift.id)
    );

    if (isDuplicate) {
      setNameError(`Shift Name "${trimmedName}" already exists.`);
      return;
    }

    const payload = mapShiftTypeToApi({
      shiftCode: trimmedCode,
      shiftName: trimmedName,
      category: formCategory,
      startTime: formStartTime,
      endTime: formEndTime,
      breakDurationMinutes: Number(formBreak),
      totalWorkingHours: Number(formWorkingHours),
      isNightShift: formIsNightShift,
      nightAllowanceEligible: formNightAllowance,
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingShift) {
        await hrShiftTypeService.update(editingShift.id, payload);
        setToastMessage(`Updated shift "${trimmedName}".`);
      } else {
        await hrShiftTypeService.create(payload);
        setToastMessage(`Created shift "${trimmedName}".`);
      }
      await loadShifts();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save shift type");
    }
  };

  const handleToggleStatus = async (s: ShiftTypeMaster) => {
    const nextStatus: ShiftStatus = s.status === "Active" ? "Inactive" : "Active";
    try {
      await hrShiftTypeService.update(s.id, { status: nextStatus });
      await loadShifts();
      setToastMessage(`Shift "${s.shiftName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteShift = async (s: ShiftTypeMaster) => {
    if (s.employeeCount > 0) {
      alert(
        `Cannot delete "${s.shiftName}" because it has ${s.employeeCount} employee(s) assigned to this shift roster. Reassign employees before deleting, or deactivate this shift instead.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete shift "${s.shiftName}"?`)) {
      try {
        await hrShiftTypeService.remove(s.id);
        if (viewingShift?.id === s.id) setViewingShift(null);
        await loadShifts();
        setToastMessage(`Deleted shift "${s.shiftName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete shift type");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Shift Types"
      description="Configure hotel shift timing schedules, break durations, night audit rules, and night shift allowance eligibilities."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Shift Types" },
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
          Add Shift Type
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Shift Master"
          value={`${stats.total}`}
          subtitle="Configured Roster Shifts"
          tone="blue"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Shifts"
          value={`${stats.active}`}
          subtitle="Operational Schedules"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Night Roster Shifts"
          value={`${stats.nightShifts}`}
          subtitle="Night Allowance Eligible"
          tone="purple"
          icon={<Moon className="h-5 w-5" />}
        />
        <HRKPICard
          label="Rostered Workforce"
          value={`${stats.totalEmployees}`}
          subtitle="Assigned Employees"
          tone="amber"
          icon={<Users className="h-5 w-5" />}
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
                placeholder="Search Shift Name or Code..."
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
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Categories</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Night">Night</option>
                <option value="General">General</option>
                <option value="Split">Split</option>
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
                <th className="py-3.5 px-4">Shift Name &amp; Code</th>
                <th className="py-3.5 px-4">Timing Window</th>
                <th className="py-3.5 px-4">Working &amp; Break</th>
                <th className="py-3.5 px-4">Night Shift Rules</th>
                <th className="py-3.5 px-4">Assigned Staff</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShifts.length > 0 ? (
                filteredShifts.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingShift(s)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl font-bold text-xs ${
                            s.isNightShift
                              ? "bg-purple-100 text-purple-800"
                              : s.category === "Morning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {s.isNightShift ? (
                            <Moon className="h-4 w-4" />
                          ) : s.category === "Morning" ? (
                            <Sunrise className="h-4 w-4" />
                          ) : (
                            <Sun className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{s.shiftName}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{s.shiftCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ⏱️ {s.startTime} - {s.endTime}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{s.totalWorkingHours} Hrs Duty</p>
                      <p className="text-[11px] text-slate-400">Break: {s.breakDurationMinutes} Mins</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {s.isNightShift ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                            🌙 Night Shift
                          </span>
                          {s.nightAllowanceEligible && (
                            <span className="text-[10px] text-emerald-800 font-bold block">
                              + Night Allowance
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Day Duty</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        👥 {s.employeeCount} Staff
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.status} />
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
                          onClick={() => setViewingShift(s)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(s)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(s)}
                          className={`rounded-xl text-xs font-semibold ${
                            s.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {s.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShift(s)}
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
                    No shift types found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredShifts.map((s) => (
          <div
            key={s.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingShift(s)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{s.shiftCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{s.shiftName}</h4>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-900 font-bold">Timing: {s.startTime} - {s.endTime}</p>
              <p className="text-slate-500">Working Duty: {s.totalWorkingHours} Hours (Break: {s.breakDurationMinutes}m)</p>
              <p className="text-slate-500">Rostered Staff: <strong>{s.employeeCount} Employees</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(s)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(s)}
                className="text-xs font-semibold"
              >
                {s.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteShift(s)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT SHIFT TYPE
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingShift ? "Edit Shift Type" : "Add Shift Type"}
          description="Configure roster timing windows, breaks, working hours, and night shift allowance settings."
          size="md"
        >
          <form onSubmit={handleSaveShift} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Shift Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SHF-MORN"
                  value={formCode}
                  onChange={(e) => {
                    setFormCode(e.target.value);
                    setCodeError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                    codeError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {codeError && <p className="text-[11px] text-rose-600 font-bold pt-1">{codeError}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Shift Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morning Shift (Shift A)"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setNameError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                    nameError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {nameError && <p className="text-[11px] text-rose-600 font-bold pt-1">{nameError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ShiftCategory)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Night">Night</option>
                  <option value="General">General</option>
                  <option value="Split">Split</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="text"
                  placeholder="e.g. 07:00 AM"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="text"
                  placeholder="e.g. 03:30 PM"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Break Duration (Minutes)</label>
                <input
                  type="number"
                  min={0}
                  value={formBreak}
                  onChange={(e) => setFormBreak(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Working Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  value={formWorkingHours}
                  onChange={(e) => setFormWorkingHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Night Shift Settings */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
              <label className="block font-bold text-purple-950 uppercase text-[11px]">
                Night Duty &amp; Allowance Rules
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-purple-200">
                  <input
                    type="checkbox"
                    checked={formIsNightShift}
                    onChange={(e) => {
                      setFormIsNightShift(e.target.checked);
                      if (!e.target.checked) setFormNightAllowance(false);
                    }}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-purple-900">Overnight Shift</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-purple-200">
                  <input
                    type="checkbox"
                    disabled={!formIsNightShift}
                    checked={formNightAllowance}
                    onChange={(e) => setFormNightAllowance(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="font-bold text-purple-900">Night Allowance Eligible</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description &amp; Notes</label>
              <textarea
                rows={3}
                placeholder="Shift coverage scope and departmental guidelines..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ShiftStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">🟢 Active (Available for roster assignment)</option>
                <option value="Inactive">⚪ Inactive (Archived / Disabled)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {editingShift ? "Update Shift Type" : "Save Shift Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW SHIFT TYPE DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingShift)}
        onClose={() => setViewingShift(null)}
        title="Shift Type Master Details"
        icon={<Clock className="h-5 w-5 text-blue-600" />}
      >
        {viewingShift && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingShift.shiftCode}</span>
              <h3 className="text-base font-black text-amber-400">{viewingShift.shiftName}</h3>
              <StatusBadge status={viewingShift.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Schedule &amp; Timings</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Shift Category:</span>
                <strong className="text-slate-900">{viewingShift.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Timing Window:</span>
                <strong className="text-slate-900">{viewingShift.startTime} - {viewingShift.endTime}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Working Hours:</span>
                <strong className="text-slate-900">{viewingShift.totalWorkingHours} Hours</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Break Duration:</span>
                <strong className="text-slate-900">{viewingShift.breakDurationMinutes} Minutes</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Assigned Staff:</span>
                <strong className="text-blue-900">{viewingShift.employeeCount} Employees</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
              <span className="font-extrabold text-purple-950 block uppercase">Overnight &amp; Allowance Rules</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingShift.isNightShift ? "bg-purple-100 text-purple-900" : "bg-slate-200 text-slate-600"}`}>
                  {viewingShift.isNightShift ? "🌙 Night Shift Duty" : "☀️ Day Duty"}
                </span>
                {viewingShift.nightAllowanceEligible && (
                  <span className="px-2.5 py-1 rounded font-bold text-xs bg-emerald-100 text-emerald-800">
                    💰 Night Allowance Eligible
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Overview</span>
              <p className="text-slate-700 leading-relaxed">{viewingShift.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Shift Type Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Categories</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
              <option value="General">General</option>
              <option value="Split">Split</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">🟢 Active</option>
              <option value="Inactive">⚪ Inactive</option>
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
