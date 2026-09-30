"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Printer,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  DollarSign,
  Users,
  CheckCircle2,
  Layers,
  Calculator,
  UserCheck,
  Building2,
  Briefcase,
  X,
  ChevronDown,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { EmptyState } from "@/components/frontoffice/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { cn } from "@/lib/utils";
import { hrSalaryStructureService, hrEmployeeService } from "@/services/human-resources";
import { mapSalaryStructureFromApi, mapSalaryStructureToApi, mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

// Types & Master Interfaces
export type ComponentType = "Earnings" | "Deductions";
export type ComponentCalcType = "Fixed Amount" | "Percentage of Basic" | "Percentage of Gross";

function isBasicSalaryLine(line: StructureComponentLine): boolean {
  return line.componentName.toLowerCase().includes("basic");
}

function clampSalaryAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function parseSalaryInput(raw: string): number {
  if (raw.trim() === "") return 0;
  return clampSalaryAmount(Number(raw));
}

const STRUCTURE_LINE_GRID =
  "sm:grid sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1.1fr)_2rem] sm:items-center sm:gap-3";

function StructureLineTableHeader({ tone }: { tone: "emerald" | "rose" }) {
  return (
    <div
      className={cn(
        "hidden px-3 sm:grid sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,1.1fr)_2rem] sm:items-center sm:gap-3 text-[10px] font-semibold uppercase tracking-wide",
        tone === "emerald" ? "text-emerald-800/70" : "text-rose-800/70",
      )}
    >
      <span>Component</span>
      <span>Calculation</span>
      <span>Value</span>
      <span className="text-right">Monthly</span>
      <span />
    </div>
  );
}

interface StructureLineRowProps {
  name: string;
  subtitle?: string;
  calcType?: ComponentCalcType;
  onCalcTypeChange?: (value: ComponentCalcType) => void;
  calcLockedLabel?: string;
  amount: number;
  onAmountChange: (value: number) => void;
  isPercent: boolean;
  computedAmount: number;
  tone: "emerald" | "rose";
  highlighted?: boolean;
  onRemove?: () => void;
}

function StructureLineRow({
  name,
  subtitle,
  calcType,
  onCalcTypeChange,
  calcLockedLabel,
  amount,
  onAmountChange,
  isPercent,
  computedAmount,
  tone,
  highlighted,
  onRemove,
}: StructureLineRowProps) {
  const amountTone = tone === "emerald" ? "text-emerald-800" : "text-rose-800";
  const inputClass =
    "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

  const handleAmountChange = (raw: string) => onAmountChange(parseSalaryInput(raw));

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-3",
        highlighted
          ? "border-emerald-300 bg-emerald-50/30"
          : tone === "emerald"
            ? "border-emerald-100"
            : "border-rose-100",
      )}
    >
      <div className={cn("hidden", STRUCTURE_LINE_GRID)}>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          {subtitle && <p className="text-[10px] font-medium text-emerald-700">{subtitle}</p>}
        </div>
        <div>
          {calcLockedLabel ? (
            <span className="flex h-[34px] w-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-600">
              {calcLockedLabel}
            </span>
          ) : (
            <select
              value={calcType}
              onChange={(e) => onCalcTypeChange?.(e.target.value as ComponentCalcType)}
              className="h-[34px] w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium text-slate-800"
            >
              <option value="Fixed Amount">Fixed (TZS)</option>
              <option value="Percentage of Basic">% of Basic</option>
            </select>
          )}
        </div>
        <div>
          <input
            type="number"
            min={0}
            step={isPercent ? 0.01 : 1}
            value={amount}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
            }}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={cn(inputClass, "h-[34px]")}
            placeholder={isPercent ? "0" : "0"}
            aria-label={`${name} value`}
          />
        </div>
        <div className="text-right">
          <span className={cn("text-sm font-bold tabular-nums", amountTone)}>
            {formatMoney(computedAmount)}
          </span>
        </div>
        <div className="flex justify-end">
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label={`Remove ${name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <span className="w-7" />
          )}
        </div>
      </div>

      <div className="space-y-2.5 sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{name}</p>
            {subtitle && <p className="text-[10px] font-medium text-emerald-700">{subtitle}</p>}
          </div>
          <span className={cn("shrink-0 text-sm font-bold tabular-nums", amountTone)}>
            {formatMoney(computedAmount)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Calculation</label>
            {calcLockedLabel ? (
              <span className="flex h-[34px] items-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-600">
                {calcLockedLabel}
              </span>
            ) : (
              <select
                value={calcType}
                onChange={(e) => onCalcTypeChange?.(e.target.value as ComponentCalcType)}
                className="h-[34px] w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-medium"
              >
                <option value="Fixed Amount">Fixed (TZS)</option>
                <option value="Percentage of Basic">% of Basic</option>
              </select>
            )}
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Value</label>
            <input
              type="number"
              min={0}
              step={isPercent ? 0.01 : 1}
              value={amount}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e" || e.key === "E") e.preventDefault();
              }}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={cn(inputClass, "h-[34px]")}
            />
          </div>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700"
          >
            Remove component
          </button>
        )}
      </div>
    </div>
  );
}

function StructureSectionHeader({
  tone,
  title,
  description,
  addLabel,
  options,
  onAdd,
}: {
  tone: "emerald" | "rose";
  title: string;
  description: string;
  addLabel: string;
  options: { id: string; label: string }[];
  onAdd: (id: string) => void;
}) {
  const toneStyles =
    tone === "emerald"
      ? {
          wrap: "border-emerald-200 bg-emerald-50/50",
          icon: "text-emerald-700",
          title: "text-emerald-950",
          desc: "text-emerald-800/80",
          select: "border-emerald-300 text-emerald-900 focus:ring-emerald-500/30",
        }
      : {
          wrap: "border-rose-200 bg-rose-50/50",
          icon: "text-rose-700",
          title: "text-rose-950",
          desc: "text-rose-800/80",
          select: "border-rose-300 text-rose-900 focus:ring-rose-500/30",
        };

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between", toneStyles.wrap)}>
      <div className="min-w-0">
        <h4 className={cn("flex items-center gap-2 text-sm font-bold", toneStyles.title)}>
          {tone === "emerald" ? (
            <DollarSign className={cn("h-4 w-4 shrink-0", toneStyles.icon)} />
          ) : (
            <Calculator className={cn("h-4 w-4 shrink-0", toneStyles.icon)} />
          )}
          {title}
        </h4>
        <p className={cn("mt-0.5 text-[11px]", toneStyles.desc)}>{description}</p>
      </div>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            onAdd(e.target.value);
            e.target.value = "";
          }
        }}
        className={cn(
          "h-9 w-full shrink-0 rounded-xl border bg-white px-3 text-xs font-semibold shadow-xs focus:outline-none focus:ring-2 sm:w-auto sm:min-w-[200px]",
          toneStyles.select,
        )}
      >
        <option value="" disabled>
          {addLabel}
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export interface MasterSalaryComponent {
  id: string;
  name: string;
  type: ComponentType;
  defaultCalcType: ComponentCalcType;
  defaultVal: number;
}

export interface StructureComponentLine {
  componentId: string;
  componentName: string;
  type: ComponentType;
  calcType: ComponentCalcType;
  amountOrPercentage: number;
  computedAmount: number;
}

export interface AssignedEmployee {
  id: string;
  name: string;
  department: string;
  designation: string;
  avatar: string;
}

export interface SalaryStructureHistoryEntry {
  id: string;
  changeDate: string;
  changedBy: string;
  description: string;
  oldNetSalary: number;
  newNetSalary: number;
}

export interface SalaryStructure {
  id: string;
  name: string;
  department: string;
  employmentType: "Permanent" | "Contract" | "Probation" | "Trainee" | "All";
  structureType: "Grade-Based" | "Role-Based" | "Custom";
  version: number;
  isCurrentVersion: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
  effectiveDate?: string;
  status: "Active" | "Inactive";
  overtimeEligible: boolean;
  incentives: number;
  earnings: StructureComponentLine[];
  deductions: StructureComponentLine[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  assignedEmployees: AssignedEmployee[];
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  history?: SalaryStructureHistoryEntry[];
}

// Master Salary Components (simulating pull from Masters > Salary Components)
export const MASTER_SALARY_COMPONENTS: MasterSalaryComponent[] = [
  { id: "SC-01", name: "Basic Salary", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 18000 },
  { id: "SC-02", name: "HRA (House Rent Allowance)", type: "Earnings", defaultCalcType: "Percentage of Basic", defaultVal: 40 },
  { id: "SC-03", name: "Food Allowance", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 2000 },
  { id: "SC-04", name: "Travel Allowance", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 1500 },
  { id: "SC-05", name: "Special / Executive Bonus", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 2500 },
  { id: "SC-06", name: "PF (Provident Fund)", type: "Deductions", defaultCalcType: "Percentage of Basic", defaultVal: 12 },
  { id: "SC-07", name: "ESI (Employee State Insurance)", type: "Deductions", defaultCalcType: "Percentage of Basic", defaultVal: 1.75 },
  { id: "SC-08", name: "Professional Tax (PT)", type: "Deductions", defaultCalcType: "Fixed Amount", defaultVal: 200 },
  { id: "SC-09", name: "TDS / Income Tax", type: "Deductions", defaultCalcType: "Fixed Amount", defaultVal: 1000 },
];

export function SalaryStructureView() {
  const [structures, setStructures] = useState<SalaryStructure[]>([])
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hydrateStructureAssignments = (
    structure: SalaryStructure,
    emps: EmployeeItem[],
    assignedIdsFromApi: string[],
  ): SalaryStructure => {
    const assignedIds = new Set([
      ...assignedIdsFromApi,
      ...emps.filter((e) => e.salaryStructureId === structure.id).map((e) => e.id),
    ]);

    return {
      ...structure,
      assignedEmployees: [...assignedIds].map((id) => {
        const emp = emps.find((e) => e.id === id);
        return emp
          ? {
              id: emp.id,
              name: emp.name,
              department: emp.department,
              designation: emp.designation,
              avatar: emp.avatar,
            }
          : { id, name: id, department: "", designation: "", avatar: "??" };
      }),
    };
  };

  const loadStructures = async () => {
    try {
      const [rows, empRows] = await Promise.all([hrSalaryStructureService.list(), hrEmployeeService.list()]);
      const emps = empRows.map(mapEmployeeFromApi);
      setEmployees(emps);
      setStructures(
        rows.map((row) => {
          const structure = mapSalaryStructureFromApi(row);
          const assignedIds = (row.assignedEmployeeIds as string[] | undefined) ?? [];
          return hydrateStructureAssignments(structure, emps, assignedIds);
        }),
      );
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load salary structures");
      setStructures([]);
      setEmployees([]);
    }
  };

  useEffect(() => { void loadStructures(); }, []);



  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedEmpType, setSelectedEmpType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningStructure, setAssigningStructure] = useState<SalaryStructure | null>(null);

  const [viewingStructure, setViewingStructure] = useState<SalaryStructure | null>(null);

  // Create/Edit Form State
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("Front Office");
  const [formEmpType, setFormEmpType] = useState<"Permanent" | "Contract" | "Probation" | "Trainee" | "All">("Permanent");
  const [formDesc, setFormDesc] = useState("");
  const [formEarnings, setFormEarnings] = useState<StructureComponentLine[]>([]);
  const [formDeductions, setFormDeductions] = useState<StructureComponentLine[]>([]);

  // Assign Form State
  const [assignMode, setAssignMode] = useState<"Individual" | "Department" | "Multiple">("Individual");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedAssignDept, setSelectedAssignDept] = useState("Front Office");
  const [selectedMultiEmpIds, setSelectedMultiEmpIds] = useState<string[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");
  const [isAssignComboboxOpen, setIsAssignComboboxOpen] = useState(false);
  const assignComboboxRef = useRef<HTMLDivElement>(null);

  // Auto-close Assign Searchable Combobox on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assignComboboxRef.current && !assignComboboxRef.current.contains(event.target as Node)) {
        setIsAssignComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Structures
  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === "ALL" || s.department === selectedDept;
      const matchEmpType = selectedEmpType === "ALL" || s.employmentType === selectedEmpType;
      const matchStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchSearch && matchDept && matchEmpType && matchStatus;
    });
  }, [structures, searchTerm, selectedDept, selectedEmpType, selectedStatus]);

  // KPI Metrics
  const departmentOptions = useMemo(
    () => [...new Set(structures.map((s) => s.department).filter(Boolean))].sort(),
    [structures],
  );

  const metrics = useMemo(() => {
    const totalStructures = structures.length;
    const activeStructuresCount = structures.filter((s) => s.status === "Active").length;
    const assignedIds = new Set([
      ...structures.flatMap((s) => s.assignedEmployees.map((e) => e.id)),
      ...employees.filter((e) => e.salaryStructureId).map((e) => e.id),
    ]);
    const assignedEmployeesCount = assignedIds.size;
    const unassignedEmployeesCount = employees.filter(
      (e) => e.status === "Active" && !assignedIds.has(e.id),
    ).length;
    const avgGross = structures.length
      ? Math.round(structures.reduce((sum, s) => sum + s.grossSalary, 0) / structures.length)
      : 0;

    return {
      totalStructures,
      activeStructuresCount,
      assignedEmployeesCount,
      unassignedEmployeesCount,
      avgGross,
    };
  }, [structures, employees]);

  // Helper for computing live calculations
  const calculateLiveTotals = (
    earnings: StructureComponentLine[],
    deductions: StructureComponentLine[],
  ) => {
    const basicComp = earnings.find((e) => isBasicSalaryLine(e)) || earnings[0];
    let basicVal = 0;
    if (basicComp) {
      basicVal = clampSalaryAmount(Number(basicComp.amountOrPercentage));
    }

    const computeLineAmount = (line: StructureComponentLine) => {
      const amt = clampSalaryAmount(Number(line.amountOrPercentage));
      if (isBasicSalaryLine(line)) {
        return amt;
      }
      if (line.calcType === "Percentage of Basic") {
        return Math.round((basicVal * amt) / 100);
      }
      return amt;
    };

    const computedEarnings = earnings.map((e) => ({
      ...e,
      amountOrPercentage: clampSalaryAmount(Number(e.amountOrPercentage)),
      computedAmount: computeLineAmount(e),
    }));

    const computedDeductions = deductions.map((d) => ({
      ...d,
      amountOrPercentage: clampSalaryAmount(Number(d.amountOrPercentage)),
      computedAmount: computeLineAmount(d),
    }));

    const gross = computedEarnings.reduce((sum, item) => sum + item.computedAmount, 0);
    const totalDed = computedDeductions.reduce((sum, item) => sum + item.computedAmount, 0);
    const net = gross - totalDed;

    return { computedEarnings, computedDeductions, gross, totalDed, net };
  };

  const liveTotals = useMemo(() => {
    return calculateLiveTotals(formEarnings, formDeductions);
  }, [formEarnings, formDeductions]);

  // Open Create / Edit Modal
  const handleOpenCreateModal = (structureToEdit?: SalaryStructure) => {
    if (structureToEdit) {
      setEditingStructureId(structureToEdit.id);
      setFormName(structureToEdit.name);
      setFormDept(structureToEdit.department);
      setFormEmpType(structureToEdit.employmentType);
      setFormDesc(structureToEdit.description || "");
      setFormEarnings(structureToEdit.earnings.map((line) =>
        isBasicSalaryLine(line) ? { ...line, calcType: "Fixed Amount" } : line,
      ));
      setFormDeductions(structureToEdit.deductions);
    } else {
      setEditingStructureId(null);
      setFormName("");
      setFormDept("Front Office");
      setFormEmpType("Permanent");
      setFormDesc("");

      // Default sample template pulled from Masters
      const defaultEarnings: StructureComponentLine[] = [
        { componentId: "SC-01", componentName: "Basic Salary", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 18000, computedAmount: 18000 },
        { componentId: "SC-02", componentName: "HRA", type: "Earnings", calcType: "Percentage of Basic", amountOrPercentage: 40, computedAmount: 7200 },
        { componentId: "SC-03", componentName: "Food Allowance", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 2000, computedAmount: 2000 },
      ];
      const defaultDeductions: StructureComponentLine[] = [
        { componentId: "SC-06", componentName: "PF", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 1800, computedAmount: 1800 },
        { componentId: "SC-07", componentName: "ESI", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 300, computedAmount: 300 },
      ];
      setFormEarnings(defaultEarnings);
      setFormDeductions(defaultDeductions);
    }
    setIsCreateModalOpen(true);
  };

  // Add component row from Master
  const handleAddComponentFromMaster = (masterId: string, type: ComponentType) => {
    const master = MASTER_SALARY_COMPONENTS.find((m) => m.id === masterId);
    if (!master) return;

    if (type === "Earnings" && master.name.toLowerCase().includes("basic")) {
      return;
    }

    const newLine: StructureComponentLine = {
      componentId: master.id,
      componentName: master.name,
      type: master.type,
      calcType: master.defaultCalcType,
      amountOrPercentage: master.defaultVal,
      computedAmount: master.defaultVal,
    };

    if (type === "Earnings") {
      setFormEarnings((prev) => [...prev, newLine]);
    } else {
      setFormDeductions((prev) => [...prev, newLine]);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setToastMessage("Please enter a structure name.");
      return;
    }

    if (!formEarnings.some(isBasicSalaryLine)) {
      setToastMessage("Basic Salary is required in the earnings section.");
      return;
    }

    const { computedEarnings, computedDeductions, gross, totalDed, net } = calculateLiveTotals(
      formEarnings,
      formDeductions,
    );

    const existing = editingStructureId
      ? structures.find((s) => s.id === editingStructureId)
      : undefined;
    const todayIso = new Date().toISOString().slice(0, 10);

    const payload = mapSalaryStructureToApi({
      name: formName.trim(),
      department: formDept,
      employmentType: formEmpType,
      structureType: existing?.structureType ?? "Grade-Based",
      version: existing?.version ?? 1,
      isCurrentVersion: existing?.isCurrentVersion ?? true,
      effectiveFrom: existing?.effectiveFrom ?? todayIso,
      effectiveTo: existing?.effectiveTo,
      description: formDesc,
      status: existing?.status ?? "Active",
      overtimeEligible: existing?.overtimeEligible ?? true,
      incentives: existing?.incentives ?? 0,
      earnings: computedEarnings,
      deductions: computedDeductions,
      grossSalary: gross,
      totalDeductions: totalDed,
      netSalary: net,
      assignedEmployees: existing?.assignedEmployees ?? [],
      createdBy: existing?.createdBy ?? "HR Admin",
      createdDate: existing?.createdDate ?? todayIso,
      lastUpdated: todayIso,
    });

    try {
      if (editingStructureId) {
        await hrSalaryStructureService.update(editingStructureId, payload);
        setToastMessage(`Salary structure "${formName}" updated successfully.`);
      } else {
        await hrSalaryStructureService.create(payload);
        setToastMessage(`Salary structure "${formName}" created successfully.`);
      }
      await loadStructures();
      setIsCreateModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save salary structure");
    }
  };

  // Open Assign Modal
  const handleOpenAssignModal = (structure: SalaryStructure) => {
    setViewingStructure(null); // Close view drawer if open so assign modal opens cleanly
    setAssigningStructure(structure);
    setAssignMode("Individual");
    setSelectedEmpId(""); // Default to empty (no employee pre-selected)
    setSelectedAssignDept(structure.department);
    setSelectedMultiEmpIds([]);
    setAssignSearchTerm("");
    setIsAssignModalOpen(true);
  };

  // Save Assign Form
  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStructure) return;

    const idsToAssign = new Set<string>();

    if (assignMode === "Individual") {
      if (selectedEmpId) idsToAssign.add(selectedEmpId);
    } else if (assignMode === "Department") {
      employees
        .filter((emp) => emp.department === selectedAssignDept)
        .forEach((emp) => idsToAssign.add(emp.id));
    } else {
      selectedMultiEmpIds.forEach((empId) => idsToAssign.add(empId));
    }

    if (idsToAssign.size === 0) {
      setToastMessage("Select at least one employee to assign.");
      return;
    }

    try {
      await Promise.all(
        [...idsToAssign].map((empId) =>
          hrEmployeeService.update(empId, { salaryStructureId: assigningStructure.id }),
        ),
      );

      const mergedIds = [
        ...new Set([...assigningStructure.assignedEmployees.map((a) => a.id), ...idsToAssign]),
      ];
      const mergedEmployees = mergedIds
        .map((id) => employees.find((emp) => emp.id === id))
        .filter(Boolean)
        .map((emp) => ({
          id: emp!.id,
          name: emp!.name,
          department: emp!.department,
          designation: emp!.designation,
          avatar: emp!.avatar,
        }));

      await hrSalaryStructureService.update(
        assigningStructure.id,
        mapSalaryStructureToApi({
          ...assigningStructure,
          assignedEmployees: mergedEmployees,
        }),
      );

      const [structureRows, empRows] = await Promise.all([
        hrSalaryStructureService.list(),
        hrEmployeeService.list(),
      ]);
      const emps = empRows.map(mapEmployeeFromApi);
      setEmployees(emps);
      setStructures(
        structureRows.map((row) => {
          const structure = mapSalaryStructureFromApi(row);
          const assignedIds = (row.assignedEmployeeIds as string[] | undefined) ?? [];
          return hydrateStructureAssignments(structure, emps, assignedIds);
        }),
      );

      setIsAssignModalOpen(false);
      setToastMessage(
        `Assigned "${assigningStructure.name}" to ${idsToAssign.size} employee(s).`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to assign salary structure");
    }
  };

  // Duplicate Structure Options
  const handleDuplicateAsNewVersion = (structure: SalaryStructure) => {
    const nextVer = structure.version + 1;
    const today = new Date().toLocaleDateString("en-GB");

    // Mark previous versions as false for isCurrentVersion
    setStructures((prev) =>
      prev.map((s) =>
        s.name.toLowerCase() === structure.name.toLowerCase()
          ? { ...s, isCurrentVersion: false }
          : s
      )
    );

    const duplicated: SalaryStructure = {
      ...structure,
      id: `SS-${Math.floor(100 + Math.random() * 900)}`,
      version: nextVer,
      isCurrentVersion: true,
      effectiveFrom: today,
      effectiveTo: undefined,
      lastUpdated: today,
      assignedEmployees: [...structure.assignedEmployees],
      history: [
        ...(structure.history || []),
        {
          id: `HIS-${Math.floor(10 + Math.random() * 90)}`,
          changeDate: today,
          changedBy: "Neha Mehta (HR Manager)",
          description: `Created Version ${nextVer} revision from Version ${structure.version}.`,
          oldNetSalary: structure.netSalary,
          newNetSalary: structure.netSalary,
        },
      ],
    };

    setStructures((prev) => [duplicated, ...prev]);
    setToastMessage(`Created Version ${nextVer} for "${structure.name}"! Set as Active Version.`);
  };

  const handleDuplicateAsNewStructure = (structure: SalaryStructure) => {
    const today = new Date().toLocaleDateString("en-GB");
    const duplicated: SalaryStructure = {
      ...structure,
      id: `SS-${Math.floor(100 + Math.random() * 900)}`,
      name: `${structure.name} (New Template)`,
      version: 1,
      isCurrentVersion: true,
      effectiveFrom: today,
      assignedEmployees: [],
      createdBy: "Neha Mehta (HR Manager)",
      createdDate: today,
      lastUpdated: today,
    };

    setStructures((prev) => [duplicated, ...prev]);
    setToastMessage(`Duplicated "${structure.name}" as new structure "${duplicated.name}".`);
  };

  const handleDeleteStructure = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete structure "${name}"?`)) return;
    try {
      await hrSalaryStructureService.remove(id);
      if (viewingStructure?.id === id) setViewingStructure(null);
      await loadStructures();
      setToastMessage(`Deleted structure "${name}".`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to delete salary structure");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedDept("ALL");
    setSelectedEmpType("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Salary Structure"
      description="Create and manage salary templates used for payroll processing, assemble components from Masters, and assign templates to employees."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Salary Structure" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Structure
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={structures.length === 0}
            onClick={() => {
              if (structures[0]) handleOpenAssignModal(structures[0]);
            }}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs disabled:opacity-50"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Assign Structure
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting salary structure templates to Excel...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <HRKPICard
          label="Total Structures"
          value={`${metrics.totalStructures}`}
          subtitle={metrics.totalStructures === 1 ? "Salary template" : "Salary templates"}
          tone="blue"
          icon={<Layers className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active"
          value={`${metrics.activeStructuresCount}`}
          subtitle="Ready for payroll"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Assigned"
          value={`${metrics.assignedEmployeesCount}`}
          subtitle="Employees mapped"
          tone="emerald"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <HRKPICard
          label="Unassigned"
          value={`${metrics.unassignedEmployeesCount}`}
          subtitle="Need a template"
          tone="amber"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="Avg. Gross"
          value={metrics.totalStructures ? formatMoney(metrics.avgGross) : "—"}
          subtitle="Per template"
          tone="blue"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
          <p className="text-xs font-semibold text-slate-700">
            {filteredStructures.length} structure{filteredStructures.length !== 1 ? "s" : ""}
            {filteredStructures.length !== structures.length && (
              <span className="text-slate-500"> · filtered from {structures.length}</span>
            )}
          </p>
        </div>

        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
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

            <div className="hidden sm:flex flex-wrap items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={selectedEmpType}
                onChange={(e) => setSelectedEmpType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All employment types</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
                <option value="Trainee">Trainee</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
              >
                <option value="ALL">All statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              >
                Reset
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold sm:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </button>
          </div>
        </div>

        <div className="hidden sm:block">
          <table className="w-full table-fixed text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[28%] px-4 py-3">Structure</th>
                <th className="w-[16%] px-4 py-3">Department</th>
                <th className="w-[14%] px-4 py-3">Components</th>
                <th className="w-[14%] px-4 py-3">Gross / Net</th>
                <th className="w-[12%] px-4 py-3">Assigned</th>
                <th className="w-[10%] px-4 py-3">Status</th>
                <th className="w-[6%] px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStructures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14">
                    <EmptyState
                      title={structures.length === 0 ? "No salary structures yet" : "No matching structures"}
                      description={
                        structures.length === 0
                          ? "Create your first salary template to use it when adding employees and running payroll."
                          : "Try adjusting your search or filters."
                      }
                      action={
                        structures.length === 0 ? (
                          <Button type="button" size="sm" onClick={() => handleOpenCreateModal()}>
                            Create Structure
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                            Clear filters
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
              filteredStructures.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer transition hover:bg-slate-50/80"
                  onClick={() => setViewingStructure(s)}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">{s.name}</p>
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                        v{s.version}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {s.employmentType} · Updated {s.lastUpdated}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{s.department}</p>
                    <p className="text-[10px] text-slate-500">{s.structureType}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">
                      {s.earnings.length} earning{s.earnings.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {s.deductions.length} deduction{s.deductions.length !== 1 ? "s" : ""}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-bold tabular-nums text-slate-900">
                      {formatMoney(s.grossSalary)}
                    </p>
                    <p className="text-[10px] font-semibold tabular-nums text-emerald-700">
                      Net {formatMoney(s.netSalary)}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-800">
                      <Users className="h-3 w-3" />
                      {s.assignedEmployees.length}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>

                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        title="View"
                        onClick={() => setViewingStructure(s)}
                        className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => handleOpenCreateModal(s)}
                        className="rounded-lg p-1.5 text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Assign"
                        onClick={() => handleOpenAssignModal(s)}
                        className="rounded-lg p-1.5 text-blue-700 transition hover:bg-blue-50"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDeleteStructure(s.id, s.name)}
                        className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden p-4 space-y-3">
          {filteredStructures.length === 0 ? (
            <EmptyState
              title={structures.length === 0 ? "No salary structures yet" : "No matching structures"}
              description={
                structures.length === 0
                  ? "Create a template to assign pay components to employees."
                  : "Try adjusting your filters."
              }
              action={
                structures.length === 0 ? (
                  <Button type="button" size="sm" onClick={() => handleOpenCreateModal()}>
                    Create Structure
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                    Clear filters
                  </Button>
                )
              }
            />
          ) : (
          filteredStructures.map((s) => (
            <div
              key={s.id}
              onClick={() => setViewingStructure(s)}
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{s.name}</p>
                  <p className="text-[10px] text-slate-500">{s.department} · {s.employmentType}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-500">Gross</p>
                  <p className="font-bold tabular-nums text-slate-900">{formatMoney(s.grossSalary)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Net</p>
                  <p className="font-bold tabular-nums text-emerald-800">{formatMoney(s.netSalary)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCreateModal(s);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 bg-emerald-700 text-xs text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenAssignModal(s);
                  }}
                >
                  Assign
                </Button>
              </div>
            </div>
          )))}
        </div>

        {filteredStructures.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500">
            Showing {filteredStructures.length} of {structures.length} structure{structures.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CREATE / EDIT SALARY STRUCTURE MODAL
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingStructureId ? "Edit Salary Structure" : "Create Salary Structure"}
          description="Build a reusable pay template with earnings and deductions. Amounts update live as you edit."
          size="2xl"
          className="max-w-3xl"
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="salary-structure-form"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {editingStructureId ? "Update Structure" : "Save Structure"}
              </Button>
            </>
          }
        >
          <form id="salary-structure-form" onSubmit={handleSaveStructure} className="min-w-0 space-y-5 pb-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Template details</h4>
                <p className="text-[11px] text-slate-500">Name and scope for this salary structure</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Structure name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Front Office Executive"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800"
                  >
                    <option value="Front Office">Front Office</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Food & Beverage">Food &amp; Beverage</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Human Resource">Human Resource</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Employment type</label>
                  <select
                    value={formEmpType}
                    onChange={(e) => setFormEmpType(e.target.value as typeof formEmpType)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-800"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Probation">Probation</option>
                    <option value="Trainee">Trainee</option>
                    <option value="All">All types</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes — grade, usage, revision history..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-3 rounded-xl border border-emerald-200 bg-white p-4">
              <StructureSectionHeader
                tone="emerald"
                title="Earnings"
                description="Components that add to gross salary. Basic salary is always included."
                addLabel="+ Add earning component"
                options={MASTER_SALARY_COMPONENTS.filter(
                  (m) => m.type === "Earnings" && !m.name.toLowerCase().includes("basic"),
                ).map((m) => ({ id: m.id, label: m.name }))}
                onAdd={(id) => handleAddComponentFromMaster(id, "Earnings")}
              />
              <StructureLineTableHeader tone="emerald" />
              <div className="space-y-2">
                {formEarnings.map((item, idx) => {
                  const isBasic = isBasicSalaryLine(item);
                  const isPercent =
                    !isBasic &&
                    (item.calcType === "Percentage of Basic" ||
                      item.calcType === "Percentage of Gross");
                  return (
                    <StructureLineRow
                      key={`${item.componentId}-${idx}`}
                      name={item.componentName}
                      subtitle={isBasic ? "Required — fixed monthly amount" : undefined}
                      calcType={item.calcType}
                      onCalcTypeChange={(val) =>
                        setFormEarnings((prev) =>
                          prev.map((line, i) => (i === idx ? { ...line, calcType: val } : line)),
                        )
                      }
                      calcLockedLabel={isBasic ? "Fixed (TZS)" : undefined}
                      amount={item.amountOrPercentage}
                      onAmountChange={(val) =>
                        setFormEarnings((prev) =>
                          prev.map((line, i) =>
                            i === idx
                              ? {
                                  ...line,
                                  amountOrPercentage: val,
                                  ...(isBasic ? { calcType: "Fixed Amount" as const } : {}),
                                }
                              : line,
                          ),
                        )
                      }
                      isPercent={isPercent}
                      computedAmount={liveTotals.computedEarnings[idx]?.computedAmount ?? 0}
                      tone="emerald"
                      highlighted={isBasic}
                      onRemove={
                        isBasic
                          ? undefined
                          : () => setFormEarnings((prev) => prev.filter((_, i) => i !== idx))
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="min-w-0 space-y-3 rounded-xl border border-rose-200 bg-white p-4">
              <StructureSectionHeader
                tone="rose"
                title="Deductions"
                description="PF, ESI, tax and other statutory or custom deductions."
                addLabel="+ Add deduction component"
                options={MASTER_SALARY_COMPONENTS.filter((m) => m.type === "Deductions").map((m) => ({
                  id: m.id,
                  label: m.name,
                }))}
                onAdd={(id) => handleAddComponentFromMaster(id, "Deductions")}
              />
              <StructureLineTableHeader tone="rose" />
              <div className="space-y-2">
                {formDeductions.map((item, idx) => {
                  const isPercent =
                    item.calcType === "Percentage of Basic" ||
                    item.calcType === "Percentage of Gross";
                  return (
                    <StructureLineRow
                      key={`${item.componentId}-${idx}`}
                      name={item.componentName}
                      calcType={item.calcType}
                      onCalcTypeChange={(val) =>
                        setFormDeductions((prev) =>
                          prev.map((line, i) => (i === idx ? { ...line, calcType: val } : line)),
                        )
                      }
                      amount={item.amountOrPercentage}
                      onAmountChange={(val) =>
                        setFormDeductions((prev) =>
                          prev.map((line, i) => (i === idx ? { ...line, amountOrPercentage: val } : line)),
                        )
                      }
                      isPercent={isPercent}
                      computedAmount={liveTotals.computedDeductions[idx]?.computedAmount ?? 0}
                      tone="rose"
                      onRemove={() => setFormDeductions((prev) => prev.filter((_, i) => i !== idx))}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-900 p-4 text-white sm:grid-cols-3 sm:gap-0">
              <div className="rounded-xl bg-slate-800/50 px-3 py-3 text-center sm:rounded-none sm:bg-transparent">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total earnings</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
                  {formatMoney(liveTotals.gross)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/50 px-3 py-3 text-center sm:border-x sm:border-slate-700/80 sm:rounded-none sm:bg-transparent">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total deductions</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-rose-400">
                  {formatMoney(liveTotals.totalDed)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-800/50 px-3 py-3 text-center sm:rounded-none sm:bg-transparent">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Net take-home</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-amber-400">
                  {formatMoney(liveTotals.net)}
                </p>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ASSIGN SALARY STRUCTURE MODAL
      ───────────────────────────────────────────────────────────── */}
      {assigningStructure && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Salary Structure Template"
          description="Map a salary structure template to individual employees or an entire department."
          size="md"
        >
          <form onSubmit={handleSaveAssign} className="space-y-4 text-xs">
            {/* Select Target Structure Template */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Salary Structure Template <span className="text-rose-500">*</span>
              </label>
              <select
                value={assigningStructure.id}
                onChange={(e) => {
                  const selected = structures.find((s) => s.id === e.target.value);
                  if (selected) setAssigningStructure(selected);
                }}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-600"
              >
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department} • Gross: {formatMoney(s.grossSalary)})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Selection Tabs */}
            <div className="p-1 rounded-xl bg-slate-100 grid grid-cols-3 gap-1 text-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setAssignMode("Individual")}
                className={`py-2 rounded-lg transition ${
                  assignMode === "Individual" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("Department")}
                className={`py-2 rounded-lg transition ${
                  assignMode === "Department" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("Multiple")}
                className={`py-2 rounded-lg transition ${
                  assignMode === "Multiple" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Multiple
              </button>
            </div>

            {/* Individual Employee Selection - Unified Searchable Combobox */}
            {assignMode === "Individual" && (
              <div className="space-y-1.5" ref={assignComboboxRef}>
                <label className="block text-xs font-bold text-slate-700">
                  Select Employee <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAssignComboboxOpen(!isAssignComboboxOpen)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-left font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                  >
                    {selectedEmpId ? (
                      (() => {
                        const emp = employees.find((e) => e.id === selectedEmpId);
                        return emp ? (
                          <span className="font-extrabold text-slate-900">
                            {emp.name}{" "}
                            <span className="text-slate-400 font-normal">
                              ({emp.empCode || emp.id} • {emp.department})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-- Select Employee --</span>
                        );
                      })()
                    ) : (
                      <span className="text-slate-400 font-normal">-- Select Employee --</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
                  </button>

                  {isAssignComboboxOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-2 text-xs animate-in fade-in">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search employee by name, ID or department..."
                          value={assignSearchTerm}
                          onChange={(e) => setAssignSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {employees.filter((emp) =>
                          assignSearchTerm
                            ? emp.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                              (emp.empCode ?? "").toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                              emp.id.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                              emp.department.toLowerCase().includes(assignSearchTerm.toLowerCase())
                            : true
                        ).map((emp) => {
                          const isAssigned =
                            emp.salaryStructureId === assigningStructure?.id ||
                            assigningStructure?.assignedEmployees.some((a) => a.id === emp.id);

                          return (
                            <button
                              key={emp.id}
                              type="button"
                              disabled={isAssigned}
                              onClick={() => {
                                setSelectedEmpId(emp.id);
                                setIsAssignComboboxOpen(false);
                                setAssignSearchTerm("");
                              }}
                              className={cn(
                                "w-full text-left p-2 rounded-xl flex items-center justify-between transition text-xs",
                                isAssigned
                                  ? "bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed"
                                  : selectedEmpId === emp.id
                                  ? "bg-emerald-50 text-emerald-950 font-bold border border-emerald-300"
                                  : "hover:bg-slate-50 text-slate-800"
                              )}
                            >
                              <div>
                                <p className="font-semibold">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {emp.empCode || emp.id} • {emp.department}
                                </p>
                              </div>
                              {isAssigned && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                  Already Assigned
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Department Selection */}
            {assignMode === "Department" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Department</label>
                <select
                  value={selectedAssignDept}
                  onChange={(e) => setSelectedAssignDept(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="" disabled>-- Select Department --</option>
                  <option value="Front Office">Front Office (All Employees)</option>
                  <option value="Housekeeping">Housekeeping (All Employees)</option>
                  <option value="Food & Beverage">Food &amp; Beverage (All Employees)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Assigning to this department will apply this template to all matching staff members.
                </p>
              </div>
            )}

            {/* Multiple Employees Checkboxes */}
            {assignMode === "Multiple" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Select Employees</label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {selectedMultiEmpIds.length} Selected
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={assignSearchTerm}
                    onChange={(e) => setAssignSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-white">
                  {employees.filter((emp) =>
                    assignSearchTerm
                      ? emp.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                        emp.id.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                        emp.department.toLowerCase().includes(assignSearchTerm.toLowerCase())
                      : true
                  ).map((emp) => {
                    const isAssigned =
                      emp.salaryStructureId === assigningStructure?.id ||
                      assigningStructure?.assignedEmployees.some((a) => a.id === emp.id);

                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-xl border transition ${
                          isAssigned
                            ? "bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed text-slate-500"
                            : selectedMultiEmpIds.includes(emp.id)
                            ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-950"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-800 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={isAssigned}
                            checked={isAssigned || selectedMultiEmpIds.includes(emp.id)}
                            onChange={(e) => {
                              if (isAssigned) return;
                              if (e.target.checked) {
                                setSelectedMultiEmpIds((prev) => [...prev, emp.id]);
                              } else {
                                setSelectedMultiEmpIds((prev) => prev.filter((id) => id !== emp.id));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <p className={`font-semibold ${isAssigned ? "line-through text-slate-500" : ""}`}>
                              {emp.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">{emp.id} • {emp.department}</span>
                          </div>
                        </div>

                        {isAssigned && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                            Already Assigned
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: DETAILED SALARY STRUCTURE PREVIEW & AUDIT
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingStructure)}
        onClose={() => setViewingStructure(null)}
        title="Detailed Salary Structure Preview"
        icon={<Layers className="h-5 w-5 text-emerald-700" />}
      >
        {viewingStructure && (
          <div className="space-y-4 text-xs">
            {/* Header Info with Version Badges */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{viewingStructure.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{viewingStructure.id}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-900 text-amber-400 border border-slate-700">
                    Version {viewingStructure.version}
                  </span>
                  {viewingStructure.isCurrentVersion && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Version
                    </span>
                  )}
                  <StatusBadge status={viewingStructure.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Structure Type</span>
                  <span className="font-extrabold text-slate-800">{viewingStructure.structureType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Department &amp; Type</span>
                  <span className="font-semibold text-slate-800">{viewingStructure.department} • {viewingStructure.employmentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Effective From</span>
                  <span className="font-semibold text-slate-800">{viewingStructure.effectiveFrom}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Effective To</span>
                  <span className="font-semibold text-slate-800">{viewingStructure.effectiveTo || "Present / Active"}</span>
                </div>
              </div>

              {viewingStructure.description && (
                <p className="text-slate-500 italic text-[11px] border-t border-slate-200 pt-2">
                  "{viewingStructure.description}"
                </p>
              )}
            </div>

            {/* Complete Financial Component Breakdown */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <span className="font-extrabold text-emerald-950 block uppercase text-[11px]">1. Earnings Breakdown</span>
              <div className="space-y-1.5">
                {viewingStructure.earnings.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-800">{e.componentName}</span>
                    <span className="font-black text-emerald-800">{formatMoney(e.computedAmount)}</span>
                  </div>
                ))}
                {viewingStructure.incentives > 0 && (
                  <div className="flex justify-between items-center bg-emerald-100/60 p-2 rounded-lg border border-emerald-200">
                    <span className="font-extrabold text-emerald-950">Performance Incentives:</span>
                    <span className="font-black text-emerald-900">+{formatMoney(viewingStructure.incentives)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-950">Overtime Eligibility:</span>
                  <span className="font-black text-amber-900">{viewingStructure.overtimeEligible ? "Eligible (1.0x Rate)" : "Exempt / Ineligible"}</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <span className="font-extrabold text-rose-950 block uppercase text-[11px]">2. Deductions Breakdown</span>
              <div className="space-y-1.5">
                {viewingStructure.deductions.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-rose-100">
                    <span className="font-semibold text-slate-800">{d.componentName}</span>
                    <span className="font-black text-rose-800">{formatMoney(d.computedAmount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white grid grid-cols-3 gap-2 text-center shadow-lg">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Gross</span>
                <span className="font-black text-white text-base">{formatMoney(viewingStructure.grossSalary)}</span>
              </div>
              <div className="border-x border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Deductions</span>
                <span className="font-black text-rose-400 text-base">-{formatMoney(viewingStructure.totalDeductions)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Net Salary</span>
                <span className="font-black text-amber-400 text-base">{formatMoney(viewingStructure.netSalary)}</span>
              </div>
            </div>

            {/* Audit Information */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Audit Information</span>
              <p className="flex justify-between text-slate-600"><span>Created By:</span> <strong>{viewingStructure.createdBy}</strong></p>
              <p className="flex justify-between text-slate-600"><span>Created Date:</span> <strong>{viewingStructure.createdDate}</strong></p>
              <p className="flex justify-between text-slate-600"><span>Last Modified Date:</span> <strong>{viewingStructure.lastUpdated}</strong></p>
            </div>

            {/* Assigned Employees List */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 block uppercase text-[11px]">
                  Assigned Employees ({viewingStructure.assignedEmployees.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAssignModal(viewingStructure)}
                  className="rounded-lg text-[11px] font-bold py-1 h-7 text-blue-700 border-blue-200"
                >
                  + Add More
                </Button>
              </div>

              {viewingStructure.assignedEmployees.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingStructure.assignedEmployees.map((emp) => (
                    <div key={emp.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <HREmployeeCell
                        name={emp.name}
                        id={emp.id}
                        avatar={emp.avatar}
                        department={emp.department}
                        designation={emp.designation}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-center py-3">No employees assigned to this template yet.</p>
              )}
            </div>

            {/* Duplication Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleDuplicateAsNewVersion(viewingStructure);
                  setViewingStructure(null);
                }}
                className="w-full text-xs font-bold text-purple-800 border-purple-300 hover:bg-purple-50"
              >
                <Layers className="h-3.5 w-3.5 mr-1" />
                Duplicate as New Version
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleDuplicateAsNewStructure(viewingStructure);
                  setViewingStructure(null);
                }}
                className="w-full text-xs font-bold text-blue-800 border-blue-300 hover:bg-blue-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Duplicate as New Template
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Salary Structures"
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Employment Type</label>
              <select
                value={selectedEmpType}
                onChange={(e) => setSelectedEmpType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Employment Types</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
                <option value="Trainee">Trainee</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-emerald-700 text-white rounded-xl font-bold"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
