"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState, useMemo, useEffect } from "react";
import {
  Coins,
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
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrSalaryComponentService } from "@/services/human-resources";
import { mapSalaryComponentFromApi, mapSalaryComponentToApi } from "@/lib/hr/api-mappers";

export type ComponentStatus = "Active" | "Inactive";
export type ComponentType = "Earning" | "Deduction";
export type CalculationType = "Flat Amount" | "% of Basic Salary" | "% of Gross Salary";

export interface SalaryComponentMaster {
  id: string;
  code: string;
  name: string;
  type: ComponentType;
  calculationType: CalculationType;
  defaultValue: number; // Flat TZS or Percentage
  isTaxable: boolean;
  isPfApplicable: boolean;
  isEsiApplicable: boolean;
  description: string;
  status: ComponentStatus;
  templateUsageCount: number;
}

export function SalaryComponentsMasterView() {
  const [components, setComponents] = useState<SalaryComponentMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadComponents = async () => {
    try {
      const rows = await hrSalaryComponentService.list();
      setComponents(rows.map(mapSalaryComponentFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load salary components");
      setComponents([]);
    }
  };

  useEffect(() => {
    void loadComponents();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponentMaster | null>(null);
  const [viewingComponent, setViewingComponent] = useState<SalaryComponentMaster | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ComponentType>("Earning");
  const [formCalcType, setFormCalcType] = useState<CalculationType>("Flat Amount");
  const [formDefaultVal, setFormDefaultVal] = useState(0);
  const [formIsTaxable, setFormIsTaxable] = useState(true);
  const [formIsPf, setFormIsPf] = useState(false);
  const [formIsEsi, setFormIsEsi] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<ComponentStatus>("Active");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = components.length;
    const earnings = components.filter((c) => c.type === "Earning").length;
    const deductions = components.filter((c) => c.type === "Deduction").length;
    const taxable = components.filter((c) => c.isTaxable).length;
    return { total, earnings, deductions, taxable };
  }, [components]);

  // Filtered List
  const filteredComponents = useMemo(() => {
    return components.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === "ALL" || c.type === typeFilter;
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [components, searchTerm, typeFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingComponent(null);
    setFormCode(`CMP-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormType("Earning");
    setFormCalcType("Flat Amount");
    setFormDefaultVal(0);
    setFormIsTaxable(true);
    setFormIsPf(false);
    setFormIsEsi(false);
    setFormDescription("");
    setFormStatus("Active");
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (c: SalaryComponentMaster) => {
    setEditingComponent(c);
    setFormCode(c.code);
    setFormName(c.name);
    setFormType(c.type);
    setFormCalcType(c.calculationType);
    setFormDefaultVal(c.defaultValue);
    setFormIsTaxable(c.isTaxable);
    setFormIsPf(c.isPfApplicable);
    setFormIsEsi(c.isEsiApplicable);
    setFormDescription(c.description);
    setFormStatus(c.status);
    setNameError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Save Salary Component (Duplicate check)
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setCodeError("");

    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim();

    if (!trimmedName) {
      setNameError("Component Name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Component Code is required.");
      return;
    }

    // Duplicate check for name
    const isDuplicate = components.some(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingComponent || c.id !== editingComponent.id)
    );

    if (isDuplicate) {
      setNameError(`Salary Component "${trimmedName}" already exists.`);
      return;
    }

    const payload = mapSalaryComponentToApi({
      code: trimmedCode,
      name: trimmedName,
      type: formType,
      calculationType: formCalcType,
      defaultValue: Number(formDefaultVal),
      isTaxable: formIsTaxable,
      isPfApplicable: formIsPf,
      isEsiApplicable: formIsEsi,
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingComponent) {
        await hrSalaryComponentService.update(editingComponent.id, payload);
        setToastMessage(`Updated salary component "${trimmedName}".`);
      } else {
        await hrSalaryComponentService.create(payload);
        setToastMessage(`Created salary component "${trimmedName}".`);
      }
      await loadComponents();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save salary component");
    }
  };

  const handleToggleStatus = async (c: SalaryComponentMaster) => {
    const nextStatus: ComponentStatus = c.status === "Active" ? "Inactive" : "Active";
    try {
      await hrSalaryComponentService.update(c.id, { status: nextStatus });
      await loadComponents();
      setToastMessage(`Salary component "${c.name}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteComponent = async (c: SalaryComponentMaster) => {
    if (c.templateUsageCount > 0) {
      alert(
        `Cannot delete "${c.name}" because it is currently used in ${c.templateUsageCount} salary structure template(s). Remove it from templates before deleting, or deactivate it instead.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete component "${c.name}"?`)) {
      try {
        await hrSalaryComponentService.remove(c.id);
        if (viewingComponent?.id === c.id) setViewingComponent(null);
        await loadComponents();
        setToastMessage(`Deleted component "${c.name}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete component");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Salary Components"
      description="Configure master pay structure earnings (Basic, HRA, Allowances) and deductions (PF, ESI, Professional Tax) for payroll templates."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Salary Components" },
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
          Add Salary Component
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Components"
          value={`${stats.total}`}
          subtitle="Master Pay Elements"
          tone="blue"
          icon={<Coins className="h-5 w-5" />}
        />
        <HRKPICard
          label="Earning Components"
          value={`${stats.earnings}`}
          subtitle="Gross Salary Additions"
          tone="emerald"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <HRKPICard
          label="Deduction Components"
          value={`${stats.deductions}`}
          subtitle="Statutory Deductions"
          tone="rose"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <HRKPICard
          label="Taxable Elements"
          value={`${stats.taxable}`}
          subtitle="Income Tax Applicable"
          tone="purple"
          icon={<ShieldCheck className="h-5 w-5" />}
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
                placeholder="Search Component Name or Code..."
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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Component Types</option>
                <option value="Earning">🟢 Earning</option>
                <option value="Deduction">🔴 Deduction</option>
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
                  setTypeFilter("ALL");
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
                <th className="py-3.5 px-4">Component Name &amp; Code</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Calculation Formula</th>
                <th className="py-3.5 px-4">Default Value</th>
                <th className="py-3.5 px-4">Statutory Applicability</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComponents.length > 0 ? (
                filteredComponents.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingComponent(c)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-xl font-bold text-xs ${
                            c.type === "Earning" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {c.type === "Earning" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{c.code}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                          c.type === "Earning"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {c.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.calculationType}
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {c.calculationType === "Flat Amount"
                        ? formatMoney(c.defaultValue)
                        : `${c.defaultValue}%`}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.isTaxable && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-900 border border-blue-200">
                            Taxable
                          </span>
                        )}
                        {c.isPfApplicable && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200">
                            PF Base
                          </span>
                        )}
                        {c.isEsiApplicable && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-50 text-purple-900 border border-purple-200">
                            ESI Base
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
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
                          onClick={() => setViewingComponent(c)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(c)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(c)}
                          className={`rounded-xl text-xs font-semibold ${
                            c.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {c.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteComponent(c)}
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
                    No salary components found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredComponents.map((c) => (
          <div
            key={c.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingComponent(c)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{c.code}</span>
                <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-900 font-bold">Type: {c.type} ({c.calculationType})</p>
              <p className="text-slate-500">
                Default Value:{" "}
                <strong>
                  {c.calculationType === "Flat Amount" ? formatMoney(c.defaultValue) : `${c.defaultValue}%`}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(c)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(c)}
                className="text-xs font-semibold"
              >
                {c.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteComponent(c)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT SALARY COMPONENT
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingComponent ? "Edit Salary Component" : "Add Salary Component"}
          description="Configure earning or deduction formulas, statutory flags (PF, ESI, TDS), and default values."
          size="md"
        >
          <form onSubmit={handleSaveComponent} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Component Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BASIC"
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
                  Component Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. House Rent Allowance (HRA)"
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
                <label className="block font-bold text-slate-700 mb-1">Component Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ComponentType)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Earning">🟢 Earning (Salary Addition)</option>
                  <option value="Deduction">🔴 Deduction (Salary Deduction)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calculation Type</label>
                <select
                  value={formCalcType}
                  onChange={(e) => setFormCalcType(e.target.value as CalculationType)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Flat Amount">Flat Amount (TZS)</option>
                  <option value="% of Basic Salary">% of Basic Salary</option>
                  <option value="% of Gross Salary">% of Gross Salary</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Value</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formDefaultVal}
                  onChange={(e) => setFormDefaultVal(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Statutory Checkboxes */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <label className="block font-bold text-slate-800 uppercase text-[11px]">
                Statutory &amp; Tax Rules
              </label>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formIsTaxable}
                    onChange={(e) => setFormIsTaxable(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">Income Taxable</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formIsPf}
                    onChange={(e) => setFormIsPf(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">PF Base</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded bg-white border border-slate-200">
                  <input
                    type="checkbox"
                    checked={formIsEsi}
                    onChange={(e) => setFormIsEsi(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-800">ESI Base</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description &amp; Purpose</label>
              <textarea
                rows={3}
                placeholder="Details regarding accounting ledger posting and payroll rules..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ComponentStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">🟢 Active (Available for salary structure mapping)</option>
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
                {editingComponent ? "Update Salary Component" : "Save Salary Component"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW SALARY COMPONENT DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingComponent)}
        onClose={() => setViewingComponent(null)}
        title="Salary Component Master Details"
        icon={<Coins className="h-5 w-5 text-emerald-700" />}
      >
        {viewingComponent && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingComponent.code}</span>
              <h3 className="text-base font-black text-amber-400">{viewingComponent.name}</h3>
              <StatusBadge status={viewingComponent.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Component Configuration</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Component Type:</span>
                <strong className={viewingComponent.type === "Earning" ? "text-emerald-800" : "text-rose-800"}>
                  {viewingComponent.type}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Calculation Formula:</span>
                <strong className="text-slate-900">{viewingComponent.calculationType}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Default Rate / Value:</span>
                <strong className="text-slate-900">
                  {viewingComponent.calculationType === "Flat Amount"
                    ? formatMoney(viewingComponent.defaultValue)
                    : `${viewingComponent.defaultValue}%`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Template Usage:</span>
                <strong className="text-blue-900">{viewingComponent.templateUsageCount} Salary Templates</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="font-extrabold text-blue-950 block uppercase">Statutory &amp; Tax Inclusion</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingComponent.isTaxable ? "bg-blue-100 text-blue-900" : "bg-slate-200 text-slate-600 line-through"}`}>
                  Taxable
                </span>
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingComponent.isPfApplicable ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-600 line-through"}`}>
                  PF Base
                </span>
                <span className={`px-2.5 py-1 rounded font-bold text-xs ${viewingComponent.isEsiApplicable ? "bg-purple-100 text-purple-900" : "bg-slate-200 text-slate-600 line-through"}`}>
                  ESI Base
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Description</span>
              <p className="text-slate-700 leading-relaxed">{viewingComponent.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Salary Component Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Component Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Component Types</option>
              <option value="Earning">🟢 Earning</option>
              <option value="Deduction">🔴 Deduction</option>
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
