"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  CalendarHeart,
  CheckCircle2,
  ClipboardList,
  Edit,
  Eye,
  Plus,
  Power,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import {
  hrEmploymentTypeService,
  hrLeavePolicyService,
  hrLeaveTypeService,
} from "@/services/human-resources";
import {
  mapEmploymentTypeFromApi,
  mapLeavePolicyFromApi,
  mapLeavePolicyToApi,
  mapLeaveTypeFromApi,
} from "@/lib/hr/api-mappers";
import type { EmploymentTypeMaster } from "@/components/hr/EmploymentTypesMasterView";
import type { LeaveTypeMaster } from "@/components/hr/LeaveTypesMasterView";

export type LeavePolicyStatus = "Active" | "Inactive";

export interface LeavePolicyAllocation {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveCode: string;
  annualQuotaDays: number;
}

export interface LeavePolicyMaster {
  id: string;
  policyCode: string;
  policyName: string;
  totalAnnualDays: number;
  applicableEmploymentTypes: string[];
  allocations: LeavePolicyAllocation[];
  description: string;
  status: LeavePolicyStatus;
  createdDate: string;
  employeeCount: number;
}

export function getLeavePolicySelectOptions(policies: LeavePolicyMaster[] = []) {
  return policies
    .filter((policy) => policy.status === "Active")
    .map((policy) => ({
      value: policy.policyName,
      label: policy.policyName,
    }));
}

function sumAllocationDays(allocations: LeavePolicyAllocation[]) {
  return allocations.reduce((sum, row) => sum + Math.max(0, row.annualQuotaDays), 0);
}

function buildDefaultAllocations(activeLeaveTypes: LeaveTypeMaster[]): LeavePolicyAllocation[] {
  return activeLeaveTypes.slice(0, 3).map((leaveType) => ({
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.leaveName,
    leaveCode: leaveType.leaveCode,
    annualQuotaDays: 0,
  }));
}

export function LeavePolicyMasterView() {
  const [policies, setPolicies] = useState<LeavePolicyMaster[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeMaster[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<EmploymentTypeMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLeaveTypes = useMemo(
    () => leaveTypes.filter((item) => item.status === "Active"),
    [leaveTypes],
  );
  const activeEmploymentTypes = useMemo(
    () => employmentTypes.filter((item) => item.status === "Active"),
    [employmentTypes],
  );

  const loadPolicies = async () => {
    try {
      const [policyRows, leaveTypeRows, employmentTypeRows] = await Promise.all([
        hrLeavePolicyService.list(),
        hrLeaveTypeService.list(),
        hrEmploymentTypeService.list(),
      ]);
      setPolicies(policyRows.map(mapLeavePolicyFromApi));
      setLeaveTypes(leaveTypeRows.map(mapLeaveTypeFromApi));
      setEmploymentTypes(employmentTypeRows.map(mapEmploymentTypeFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load leave policies");
      setPolicies([]);
      setLeaveTypes([]);
      setEmploymentTypes([]);
    }
  };

  useEffect(() => {
    void loadPolicies();
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeavePolicyStatus>("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicyMaster | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<LeavePolicyMaster | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<LeavePolicyStatus>("Active");
  const [formEmploymentTypes, setFormEmploymentTypes] = useState<string[]>([]);
  const [formAllocations, setFormAllocations] = useState<LeavePolicyAllocation[]>([]);
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [allocationError, setAllocationError] = useState("");

  const stats = useMemo(() => {
    const total = policies.length;
    const active = policies.filter((policy) => policy.status === "Active").length;
    const mappedStaff = policies.reduce((sum, policy) => sum + policy.employeeCount, 0);
    const avgDays =
      policies.length > 0
        ? Math.round(
            policies.reduce((sum, policy) => sum + policy.totalAnnualDays, 0) / policies.length,
          )
        : 0;
    return { total, active, mappedStaff, avgDays };
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        policy.policyName.toLowerCase().includes(query) ||
        policy.policyCode.toLowerCase().includes(query) ||
        policy.applicableEmploymentTypes.some((type) => type.toLowerCase().includes(query));

      const matchStatus = statusFilter === "ALL" || policy.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [policies, searchTerm, statusFilter]);

  const formTotalDays = useMemo(() => sumAllocationDays(formAllocations), [formAllocations]);

  const resetForm = () => {
    setFormCode(`LP-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormDescription("");
    setFormStatus("Active");
    setFormEmploymentTypes([]);
    setFormAllocations(buildDefaultAllocations(activeLeaveTypes));
    setNameError("");
    setCodeError("");
    setAllocationError("");
  };

  const handleOpenCreateModal = () => {
    setEditingPolicy(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (policy: LeavePolicyMaster) => {
    setEditingPolicy(policy);
    setFormCode(policy.policyCode);
    setFormName(policy.policyName);
    setFormDescription(policy.description);
    setFormStatus(policy.status);
    setFormEmploymentTypes([...policy.applicableEmploymentTypes]);
    setFormAllocations(policy.allocations.map((row) => ({ ...row })));
    setNameError("");
    setCodeError("");
    setAllocationError("");
    setIsModalOpen(true);
  };

  const handleAllocationChange = (
    index: number,
    field: keyof LeavePolicyAllocation,
    value: string | number,
  ) => {
    setFormAllocations((prev) =>
      prev.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        if (field === "leaveTypeId") {
          const leaveType = activeLeaveTypes.find((item) => item.id === value);
          if (!leaveType) return row;
          return {
            ...row,
            leaveTypeId: leaveType.id,
            leaveTypeName: leaveType.leaveName,
            leaveCode: leaveType.leaveCode,
          };
        }
        return { ...row, [field]: value };
      }),
    );
    setAllocationError("");
  };

  const handleAddAllocationRow = () => {
    const usedIds = new Set(formAllocations.map((row) => row.leaveTypeId));
    const nextLeaveType = activeLeaveTypes.find((item) => !usedIds.has(item.id));
    if (!nextLeaveType) return;

    setFormAllocations((prev) => [
      ...prev,
      {
        leaveTypeId: nextLeaveType.id,
        leaveTypeName: nextLeaveType.leaveName,
        leaveCode: nextLeaveType.leaveCode,
        annualQuotaDays: 0,
      },
    ]);
  };

  const handleRemoveAllocationRow = (index: number) => {
    if (formAllocations.length <= 1) return;
    setFormAllocations((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const toggleEmploymentType = (typeName: string) => {
    setFormEmploymentTypes((prev) =>
      prev.includes(typeName) ? prev.filter((item) => item !== typeName) : [...prev, typeName],
    );
  };

  const handleSavePolicy = async (event: React.FormEvent) => {
    event.preventDefault();
    setNameError("");
    setCodeError("");
    setAllocationError("");

    const trimmedName = formName.trim();
    const trimmedCode = formCode.trim();
    const normalizedAllocations = formAllocations
      .filter((row) => row.annualQuotaDays > 0)
      .map((row) => ({ ...row }));

    if (!trimmedName) {
      setNameError("Policy name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Policy code is required.");
      return;
    }

    if (normalizedAllocations.length === 0) {
      setAllocationError("Add at least one leave type with quota greater than zero.");
      return;
    }

    const duplicateName = policies.some(
      (policy) =>
        policy.policyName.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingPolicy || policy.id !== editingPolicy.id),
    );
    if (duplicateName) {
      setNameError(`Leave policy "${trimmedName}" already exists.`);
      return;
    }

    const payload = mapLeavePolicyToApi({
      policyCode: trimmedCode,
      policyName: trimmedName,
      totalAnnualDays: sumAllocationDays(normalizedAllocations),
      applicableEmploymentTypes: formEmploymentTypes,
      allocations: normalizedAllocations,
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingPolicy) {
        await hrLeavePolicyService.update(editingPolicy.id, payload);
        setToastMessage(`Updated leave policy "${trimmedName}".`);
      } else {
        await hrLeavePolicyService.create(payload);
        setToastMessage(`Created leave policy "${trimmedName}".`);
      }
      await loadPolicies();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save leave policy");
    }
  };

  const handleToggleStatus = async (policy: LeavePolicyMaster) => {
    const nextStatus: LeavePolicyStatus = policy.status === "Active" ? "Inactive" : "Active";
    try {
      await hrLeavePolicyService.update(policy.id, { status: nextStatus });
      await loadPolicies();
      setToastMessage(`Leave policy "${policy.policyName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeletePolicy = async (policy: LeavePolicyMaster) => {
    if (policy.employeeCount > 0) {
      alert(
        `Cannot delete "${policy.policyName}" because ${policy.employeeCount} employee(s) are assigned to it.`,
      );
      return;
    }

    if (confirm(`Delete leave policy "${policy.policyName}"?`)) {
      try {
        await hrLeavePolicyService.remove(policy.id);
        if (viewingPolicy?.id === policy.id) setViewingPolicy(null);
        await loadPolicies();
        setToastMessage(`Deleted leave policy "${policy.policyName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete leave policy");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Leave Policies"
      description="Define annual leave bundles by grouping leave types, quotas, and applicable employment categories for employee assignment."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Leave Policies" },
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
          Add Leave Policy
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Policies"
          value={`${stats.total}`}
          subtitle="Configured Bundles"
          tone="blue"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Policies"
          value={`${stats.active}`}
          subtitle="Available for Assignment"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Avg Annual Days"
          value={`${stats.avgDays}`}
          subtitle="Per Policy Bundle"
          tone="purple"
          icon={<CalendarHeart className="h-5 w-5" />}
        />
        <HRKPICard
          label="Mapped Staff"
          value={`${stats.mappedStaff}`}
          subtitle="Employees Assigned"
          tone="amber"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search policy name or code..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
              {searchTerm ? (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "ALL" | LeavePolicyStatus)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>

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

      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Leave Policy</th>
                <th className="py-3.5 px-4">Annual Days</th>
                <th className="py-3.5 px-4">Leave Types Included</th>
                <th className="py-3.5 px-4">Employment Types</th>
                <th className="py-3.5 px-4">Mapped Staff</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy) => (
                  <tr
                    key={policy.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingPolicy(policy)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{policy.policyName}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{policy.policyCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        {policy.totalAnnualDays} Days
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {policy.allocations.map((row) => (
                          <span
                            key={`${policy.id}-${row.leaveTypeId}`}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {row.leaveCode}: {row.annualQuotaDays}d
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-700 font-medium line-clamp-2">
                        {policy.applicableEmploymentTypes.length > 0
                          ? policy.applicableEmploymentTypes.join(", ")
                          : "All employment types"}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {policy.employeeCount} Staff
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={policy.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingPolicy(policy)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(policy)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(policy)}
                          className={`rounded-xl text-xs font-semibold ${
                            policy.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {policy.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy)}
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
                    No leave policies found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden space-y-3">
        {filteredPolicies.map((policy) => (
          <div
            key={policy.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingPolicy(policy)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{policy.policyCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{policy.policyName}</h4>
              </div>
              <StatusBadge status={policy.status} />
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">
                Annual days: <strong>{policy.totalAnnualDays}</strong>
              </p>
              <p className="text-slate-500">Mapped staff: {policy.employeeCount}</p>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(event) => event.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(policy)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(policy)}
                className="text-xs font-semibold"
              >
                {policy.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeletePolicy(policy)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen ? (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPolicy ? "Edit Leave Policy" : "Add Leave Policy"}
          description="Group leave types and annual quotas into a policy bundle for employee assignment."
          size="lg"
        >
          <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Policy Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(event) => {
                    setFormCode(event.target.value);
                    setCodeError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 ${
                    codeError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {codeError ? <p className="text-[11px] text-rose-600 font-bold pt-1">{codeError}</p> : null}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Policy Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(event) => {
                    setFormName(event.target.value);
                    setNameError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                    nameError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {nameError ? <p className="text-[11px] text-rose-600 font-bold pt-1">{nameError}</p> : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800">Leave type allocations</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total annual days: <strong>{formTotalDays}</strong>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddAllocationRow}
                  className="rounded-xl text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add type
                </Button>
              </div>

              <div className="space-y-2">
                {formAllocations.map((row, index) => (
                  <div key={`${row.leaveTypeId}-${index}`} className="grid grid-cols-[1fr_120px_auto] gap-2 items-center">
                    <select
                      value={row.leaveTypeId}
                      onChange={(event) =>
                        handleAllocationChange(index, "leaveTypeId", event.target.value)
                      }
                      className="rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                    >
                      {activeLeaveTypes.map((leaveType) => (
                        <option key={leaveType.id} value={leaveType.id}>
                          {leaveType.leaveName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={row.annualQuotaDays}
                      onChange={(event) =>
                        handleAllocationChange(index, "annualQuotaDays", Number(event.target.value))
                      }
                      className="rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                      placeholder="Days"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAllocationRow(index)}
                      className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                      aria-label="Remove allocation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {allocationError ? (
                <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {allocationError}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
              <p className="font-bold text-slate-800">Applicable employment types</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeEmploymentTypes.map((employmentType) => (
                  <label
                    key={employmentType.id}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200"
                  >
                    <input
                      type="checkbox"
                      checked={formEmploymentTypes.includes(employmentType.typeName)}
                      onChange={() => toggleEmploymentType(employmentType.typeName)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-slate-800">{employmentType.typeName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={formDescription}
                onChange={(event) => setFormDescription(event.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
                placeholder="Describe when this policy should be used..."
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(event) => setFormStatus(event.target.value as LeavePolicyStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
                {editingPolicy ? "Update Leave Policy" : "Save Leave Policy"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      <Drawer
        isOpen={Boolean(viewingPolicy)}
        onClose={() => setViewingPolicy(null)}
        title="Leave Policy Details"
        icon={<ClipboardList className="h-5 w-5 text-emerald-600" />}
      >
        {viewingPolicy ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">
                {viewingPolicy.policyCode}
              </span>
              <h3 className="text-base font-black text-emerald-300">{viewingPolicy.policyName}</h3>
              <StatusBadge status={viewingPolicy.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total annual days</span>
                <strong className="text-slate-900">{viewingPolicy.totalAnnualDays} days</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mapped employees</span>
                <strong className="text-blue-900">{viewingPolicy.employeeCount}</strong>
              </div>
              <div>
                <span className="text-slate-600 block mb-1">Employment types</span>
                <p className="font-medium text-slate-900">
                  {viewingPolicy.applicableEmploymentTypes.length > 0
                    ? viewingPolicy.applicableEmploymentTypes.join(", ")
                    : "All employment types"}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <span className="font-extrabold text-emerald-950 block uppercase">Leave allocations</span>
              <div className="space-y-1.5">
                {viewingPolicy.allocations.map((row) => (
                  <div
                    key={row.leaveTypeId}
                    className="flex items-center justify-between rounded-lg bg-white border border-emerald-100 px-3 py-2"
                  >
                    <span className="font-semibold text-slate-800">{row.leaveTypeName}</span>
                    <span className="font-bold text-emerald-800">{row.annualQuotaDays} days</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Description</span>
              <p className="text-slate-700 leading-relaxed">{viewingPolicy.description || "—"}</p>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Leave Policy Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | LeavePolicyStatus)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
