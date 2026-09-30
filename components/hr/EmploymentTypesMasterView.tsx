"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Briefcase,
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
  Building2,
  Clock,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrEmploymentTypeService } from "@/services/human-resources";
import { mapEmploymentTypeFromApi, mapEmploymentTypeToApi } from "@/lib/hr/api-mappers";

export type EmploymentTypeStatus = "Active" | "Inactive";
export type WorkingTerm = "Full-Time" | "Part-Time" | "Shift-Based" | "Contractual" | "Temporary";

export interface EmploymentTypeMaster {
  id: string;
  typeCode: string;
  typeName: string;
  workingTerm: WorkingTerm;
  probationDays: number;
  noticePeriodDays: number;
  pfEligible: boolean;
  esiEligible: boolean;
  leaveEligible: boolean;
  description: string;
  status: EmploymentTypeStatus;
  createdDate: string;
  employeeCount: number;
}

export function EmploymentTypesMasterView() {
  const [types, setTypes] = useState<EmploymentTypeMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadTypes = async () => {
    try {
      const rows = await hrEmploymentTypeService.list();
      setTypes(rows.map(mapEmploymentTypeFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load employment types");
      setTypes([]);
    }
  };

  useEffect(() => {
    void loadTypes();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [termFilter, setTermFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EmploymentTypeMaster | null>(null);
  const [viewingType, setViewingType] = useState<EmploymentTypeMaster | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formWorkingTerm, setFormWorkingTerm] = useState<WorkingTerm>("Full-Time");
  const [formProbation, setFormProbation] = useState(90);
  const [formNotice, setFormNotice] = useState(30);
  const [formPfEligible, setFormPfEligible] = useState(true);
  const [formEsiEligible, setFormEsiEligible] = useState(true);
  const [formLeaveEligible, setFormLeaveEligible] = useState(true);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<EmploymentTypeStatus>("Active");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = types.length;
    const active = types.filter((t) => t.status === "Active").length;
    const inactive = types.filter((t) => t.status === "Inactive").length;
    const totalEmployees = types.reduce((sum, t) => sum + t.employeeCount, 0);
    return { total, active, inactive, totalEmployees };
  }, [types]);

  // Filtered List
  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      const matchSearch =
        t.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.typeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.workingTerm.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTerm = termFilter === "ALL" || t.workingTerm === termFilter;
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;

      return matchSearch && matchTerm && matchStatus;
    });
  }, [types, searchTerm, termFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingType(null);
    setFormCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormWorkingTerm("Full-Time");
    setFormProbation(90);
    setFormNotice(30);
    setFormPfEligible(true);
    setFormEsiEligible(true);
    setFormLeaveEligible(true);
    setFormDescription("");
    setFormStatus("Active");
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (t: EmploymentTypeMaster) => {
    setEditingType(t);
    setFormCode(t.typeCode);
    setFormName(t.typeName);
    setFormWorkingTerm(t.workingTerm);
    setFormProbation(t.probationDays);
    setFormNotice(t.noticePeriodDays);
    setFormPfEligible(t.pfEligible);
    setFormEsiEligible(t.esiEligible);
    setFormLeaveEligible(t.leaveEligible);
    setFormDescription(t.description);
    setFormStatus(t.status);
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Save Employment Type (Duplicate check)
  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setCodeError("");

    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim();

    if (!trimmedName) {
      setNameError("Employment Type Name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Type Code is required.");
      return;
    }

    const isDuplicate = types.some(
      (t) =>
        t.typeName.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingType || t.id !== editingType.id)
    );

    if (isDuplicate) {
      setNameError(`Employment Type "${trimmedName}" already exists.`);
      return;
    }

    const payload = mapEmploymentTypeToApi({
      typeCode: trimmedCode,
      typeName: trimmedName,
      workingTerm: formWorkingTerm,
      probationDays: Number(formProbation),
      noticePeriodDays: Number(formNotice),
      pfEligible: formPfEligible,
      esiEligible: formEsiEligible,
      leaveEligible: formLeaveEligible,
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingType) {
        await hrEmploymentTypeService.update(editingType.id, payload);
        setToastMessage(`Updated employment type "${trimmedName}".`);
      } else {
        await hrEmploymentTypeService.create(payload);
        setToastMessage(`Created employment type "${trimmedName}".`);
      }
      await loadTypes();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save employment type");
    }
  };

  const handleToggleStatus = async (t: EmploymentTypeMaster) => {
    const nextStatus: EmploymentTypeStatus = t.status === "Active" ? "Inactive" : "Active";
    try {
      await hrEmploymentTypeService.update(t.id, { status: nextStatus });
      await loadTypes();
      setToastMessage(`Employment type "${t.typeName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteType = async (t: EmploymentTypeMaster) => {
    if (t.employeeCount > 0) {
      alert(
        `Cannot delete "${t.typeName}" because it has ${t.employeeCount} active employee(s) assigned to this category. Reassign employees before deleting, or deactivate this type instead.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete employment type "${t.typeName}"?`)) {
      try {
        await hrEmploymentTypeService.remove(t.id);
        if (viewingType?.id === t.id) setViewingType(null);
        await loadTypes();
        setToastMessage(`Deleted employment type "${t.typeName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete employment type");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Employment Types"
      description="Configure employment terms, statutory benefit eligibilities (PF, ESI, Leaves), probation periods, and notice rules across the workforce."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Employment Types" },
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
          Add Employment Type
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Categories"
          value={`${stats.total}`}
          subtitle="Employment Types"
          tone="blue"
          icon={<Briefcase className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Categories"
          value={`${stats.active}`}
          subtitle="Available for Selection"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Inactive Categories"
          value={`${stats.inactive}`}
          subtitle="Disabled / Archived"
          tone="rose"
          icon={<XCircle className="h-5 w-5" />}
        />
        <HRKPICard
          label="Mapped Staff"
          value={`${stats.totalEmployees}`}
          subtitle="Active Employees"
          tone="purple"
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
                placeholder="Search Type Name or Code..."
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
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Working Terms</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Shift-Based">Shift-Based</option>
                <option value="Contractual">Contractual</option>
                <option value="Temporary">Temporary</option>
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
                  setTermFilter("ALL");
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
                <th className="py-3.5 px-4">Employment Type</th>
                <th className="py-3.5 px-4">Working Term</th>
                <th className="py-3.5 px-4">Probation / Notice</th>
                <th className="py-3.5 px-4">Statutory Benefits</th>
                <th className="py-3.5 px-4">Mapped Staff</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTypes.length > 0 ? (
                filteredTypes.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingType(t)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                          <Briefcase className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{t.typeName}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{t.typeCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {t.workingTerm}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">Probation: {t.probationDays} Days</p>
                      <p className="text-[11px] text-slate-400">Notice: {t.noticePeriodDays} Days</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.pfEligible && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            PF
                          </span>
                        )}
                        {t.esiEligible && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                            ESI
                          </span>
                        )}
                        {t.leaveEligible && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-800 border border-purple-200">
                            Paid Leaves
                          </span>
                        )}
                        {!t.pfEligible && !t.esiEligible && !t.leaveEligible && (
                          <span className="text-[11px] text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        👥 {t.employeeCount} Staff
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={t.status} />
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
                          onClick={() => setViewingType(t)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(t)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(t)}
                          className={`rounded-xl text-xs font-semibold ${
                            t.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {t.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteType(t)}
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
                    No employment types found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredTypes.map((t) => (
          <div
            key={t.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingType(t)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{t.typeCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{t.typeName}</h4>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">Working Term: <strong>{t.workingTerm}</strong></p>
              <p className="text-slate-500">Probation: {t.probationDays} Days • Notice: {t.noticePeriodDays} Days</p>
              <p className="text-slate-500">Staff Count: <strong>{t.employeeCount} Employees</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(t)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(t)}
                className="text-xs font-semibold"
              >
                {t.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteType(t)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT EMPLOYMENT TYPE
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingType ? "Edit Employment Type" : "Add Employment Type"}
          description="Configure working terms, probation, notice rules, and statutory benefit eligibilities."
          size="md"
        >
          <form onSubmit={handleSaveType} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Type Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-PERM"
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
                  Employment Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Permanent / Full-Time"
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
                <label className="block font-bold text-slate-700 mb-1">Working Term</label>
                <select
                  value={formWorkingTerm}
                  onChange={(e) => setFormWorkingTerm(e.target.value as WorkingTerm)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Shift-Based">Shift-Based</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Probation (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={formProbation}
                  onChange={(e) => setFormProbation(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notice Period (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={formNotice}
                  onChange={(e) => setFormNotice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>
            </div>

            {/* Statutory Benefits Checklist */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <label className="block font-bold text-slate-800 uppercase text-[11px]">
                Statutory Benefit Eligibilities
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formPfEligible}
                    onChange={(e) => setFormPfEligible(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">PF Deduction</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formEsiEligible}
                    onChange={(e) => setFormEsiEligible(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">ESI Insurance</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formLeaveEligible}
                    onChange={(e) => setFormLeaveEligible(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Paid Leave Credit</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description &amp; Terms</label>
              <textarea
                rows={3}
                placeholder="Outline statutory rules and employment agreement scope..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as EmploymentTypeStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">🟢 Active (Available for employee assignment)</option>
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
                {editingType ? "Update Employment Type" : "Save Employment Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW EMPLOYMENT TYPE DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingType)}
        onClose={() => setViewingType(null)}
        title="Employment Type Details"
        icon={<Briefcase className="h-5 w-5 text-blue-600" />}
      >
        {viewingType && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingType.typeCode}</span>
              <h3 className="text-base font-black text-amber-400">{viewingType.typeName}</h3>
              <StatusBadge status={viewingType.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Terms &amp; Periods</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Working Term:</span>
                <strong className="text-slate-900">{viewingType.workingTerm}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Probation Period:</span>
                <strong className="text-slate-900">{viewingType.probationDays} Days</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Notice Period:</span>
                <strong className="text-slate-900">{viewingType.noticePeriodDays} Days</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Assigned Employees:</span>
                <strong className="text-blue-900">{viewingType.employeeCount} Staff Members</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="font-extrabold text-blue-950 block uppercase">Statutory Benefit Eligibilities</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingType.pfEligible ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-500 line-through"}`}>
                  PF Deduction
                </span>
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingType.esiEligible ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-500 line-through"}`}>
                  ESI Medical Insurance
                </span>
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingType.leaveEligible ? "bg-purple-100 text-purple-800" : "bg-slate-200 text-slate-500 line-through"}`}>
                  Paid Annual Leave
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Scope &amp; Description</span>
              <p className="text-slate-700 leading-relaxed">{viewingType.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Employment Type Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Working Term</label>
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Working Terms</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Shift-Based">Shift-Based</option>
              <option value="Contractual">Contractual</option>
              <option value="Temporary">Temporary</option>
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
