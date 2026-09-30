"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
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
  Layers,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrDepartmentService, hrDesignationService } from "@/services/human-resources";
import {
  buildIdNameMap,
  mapDepartmentFromApi,
  mapDesignationFromApi,
  mapDesignationToApi,
} from "@/lib/hr/api-mappers";
import type { DepartmentMaster } from "@/components/hr/DepartmentMasterView";

export type DesignationStatus = "Active" | "Inactive";
export type JobGrade = "Executive (L1)" | "Senior (L2)" | "Managerial (L3)" | "Director (L4)";

export interface DesignationMaster {
  id: string;
  designationCode: string;
  designationTitle: string;
  department: string;
  jobGrade: JobGrade;
  description: string;
  status: DesignationStatus;
  createdDate: string;
  employeeCount: number;
}

export function DesignationMasterView() {
  const [designations, setDesignations] = useState<DesignationMaster[]>([]);
  const [departments, setDepartments] = useState<DepartmentMaster[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const deptNameById = useMemo(
    () => new Map(departments.map((d) => [d.id, d.departmentName])),
    [departments],
  );
  const deptIdByName = useMemo(
    () => new Map(departments.map((d) => [d.departmentName, d.id])),
    [departments],
  );
  const deptNames = useMemo(() => departments.map((d) => d.departmentName), [departments]);

  const loadData = async () => {
    try {
      const [deptRows, desigRows] = await Promise.all([
        hrDepartmentService.list(),
        hrDesignationService.list(),
      ]);
      const mappedDepts = deptRows.map(mapDepartmentFromApi);
      const idToName = buildIdNameMap(deptRows, "departmentName");
      setDepartments(mappedDepts);
      setDesignations(
        desigRows.map((row) =>
          mapDesignationFromApi(row, idToName.get(String(row.departmentId)) ?? ""),
        ),
      );
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load designations");
      setDesignations([]);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [gradeFilter, setGradeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<DesignationMaster | null>(null);
  const [viewingDesignation, setViewingDesignation] = useState<DesignationMaster | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formGrade, setFormGrade] = useState<JobGrade>("Executive (L1)");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<DesignationStatus>("Active");
  const [titleError, setTitleError] = useState("");
  const [codeError, setCodeError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = designations.length;
    const active = designations.filter((d) => d.status === "Active").length;
    const inactive = designations.filter((d) => d.status === "Inactive").length;
    const totalEmployees = designations.reduce((sum, d) => sum + d.employeeCount, 0);
    return { total, active, inactive, totalEmployees };
  }, [designations]);

  // Filtered Designations
  const filteredDesignations = useMemo(() => {
    return designations.filter((d) => {
      const matchSearch =
        d.designationTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.designationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = deptFilter === "ALL" || d.department === deptFilter;
      const matchGrade = gradeFilter === "ALL" || d.jobGrade === gradeFilter;
      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;

      return matchSearch && matchDept && matchGrade && matchStatus;
    });
  }, [designations, searchTerm, deptFilter, gradeFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDesignation(null);
    setFormCode(`DSG-${Math.floor(100 + Math.random() * 900)}`);
    setFormTitle("");
    setFormDept(deptNames[0] ?? "");
    setFormGrade("Executive (L1)");
    setFormDescription("");
    setFormStatus("Active");
    setTitleError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dsg: DesignationMaster) => {
    setEditingDesignation(dsg);
    setFormCode(dsg.designationCode);
    setFormTitle(dsg.designationTitle);
    setFormDept(dsg.department);
    setFormGrade(dsg.jobGrade);
    setFormDescription(dsg.description);
    setFormStatus(dsg.status);
    setTitleError("");
    setCodeError("");
    setIsModalOpen(true);
  };

  // Save Designation (Duplicate check)
  const handleSaveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError("");
    setCodeError("");

    const trimmedTitle = formTitle.trim();
    const trimmedCode = formCode.trim();

    if (!trimmedTitle) {
      setTitleError("Designation Title is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Designation Code is required.");
      return;
    }

    // Duplicate check for title within same department
    const isDuplicateTitle = designations.some(
      (d) =>
        d.designationTitle.toLowerCase() === trimmedTitle.toLowerCase() &&
        d.department === formDept &&
        (!editingDesignation || d.id !== editingDesignation.id)
    );

    if (isDuplicateTitle) {
      setTitleError(`Designation "${trimmedTitle}" already exists under ${formDept}.`);
      return;
    }

    const departmentId = deptIdByName.get(formDept);
    if (!departmentId) {
      setTitleError("Please select a valid department.");
      return;
    }

    const payload = mapDesignationToApi({
      designationCode: trimmedCode,
      designationTitle: trimmedTitle,
      departmentId,
      jobGrade: formGrade,
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingDesignation) {
        await hrDesignationService.update(editingDesignation.id, payload);
        setToastMessage(`Updated designation "${trimmedTitle}".`);
      } else {
        await hrDesignationService.create(payload);
        setToastMessage(`Created designation "${trimmedTitle}".`);
      }
      await loadData();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save designation");
    }
  };

  const handleToggleStatus = async (dsg: DesignationMaster) => {
    const nextStatus: DesignationStatus = dsg.status === "Active" ? "Inactive" : "Active";
    try {
      await hrDesignationService.update(dsg.id, { status: nextStatus });
      await loadData();
      setToastMessage(`Designation "${dsg.designationTitle}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteDesignation = async (dsg: DesignationMaster) => {
    if (dsg.employeeCount > 0) {
      alert(
        `Cannot delete "${dsg.designationTitle}" because it has ${dsg.employeeCount} employee(s) assigned to this title. Reassign employees before deleting, or deactivate this designation instead.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete designation "${dsg.designationTitle}"?`)) {
      try {
        await hrDesignationService.remove(dsg.id);
        if (viewingDesignation?.id === dsg.id) setViewingDesignation(null);
        await loadData();
        setToastMessage(`Deleted designation "${dsg.designationTitle}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete designation");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Designations"
      description="Manage job titles, job grades, department mappings, and position definitions across the hotel hierarchy."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Designations" },
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
          Add Designation
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Designations"
          value={`${stats.total}`}
          subtitle="Master Job Titles"
          tone="blue"
          icon={<Award className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Job Titles"
          value={`${stats.active}`}
          subtitle="Available for Selection"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Inactive Titles"
          value={`${stats.inactive}`}
          subtitle="Disabled / Archived"
          tone="rose"
          icon={<XCircle className="h-5 w-5" />}
        />
        <HRKPICard
          label="Mapped Employees"
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
                placeholder="Search Title or Code..."
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
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                {deptNames.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Job Grades</option>
                <option value="Executive (L1)">Executive (L1)</option>
                <option value="Senior (L2)">Senior (L2)</option>
                <option value="Managerial (L3)">Managerial (L3)</option>
                <option value="Director (L4)">Director (L4)</option>
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
                  setDeptFilter("ALL");
                  setGradeFilter("ALL");
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
                <th className="py-3.5 px-4">Designation Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Job Grade</th>
                <th className="py-3.5 px-4">Mapped Employees</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDesignations.length > 0 ? (
                filteredDesignations.map((dsg) => (
                  <tr
                    key={dsg.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingDesignation(dsg)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{dsg.designationTitle}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{dsg.designationCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">{dsg.department}</td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {dsg.jobGrade}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        👥 {dsg.employeeCount} Employees
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={dsg.status} />
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
                          onClick={() => setViewingDesignation(dsg)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(dsg)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(dsg)}
                          className={`rounded-xl text-xs font-semibold ${
                            dsg.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {dsg.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDesignation(dsg)}
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
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No designations found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredDesignations.map((dsg) => (
          <div
            key={dsg.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingDesignation(dsg)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{dsg.designationCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{dsg.designationTitle}</h4>
              </div>
              <StatusBadge status={dsg.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">Department: <strong>{dsg.department}</strong></p>
              <p className="text-slate-500">Grade: {dsg.jobGrade}</p>
              <p className="text-slate-500">Employees Assigned: <strong>{dsg.employeeCount}</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(dsg)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(dsg)}
                className="text-xs font-semibold"
              >
                {dsg.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDesignation(dsg)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT DESIGNATION
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDesignation ? "Edit Designation" : "Add Designation"}
          description="Create or update designation title, department mapping, and job grade level."
          size="md"
        >
          <form onSubmit={handleSaveDesignation} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Designation Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DSG-FO-01"
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
                  Designation Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front Desk Manager"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    setTitleError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                    titleError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {titleError && <p className="text-[11px] text-rose-600 font-bold pt-1">{titleError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <select
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  {deptNames.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Job Grade Level</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value as JobGrade)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Executive (L1)">Executive (L1)</option>
                  <option value="Senior (L2)">Senior (L2)</option>
                  <option value="Managerial (L3)">Managerial (L3)</option>
                  <option value="Director (L4)">Director (L4)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Job Description &amp; Duties</label>
              <textarea
                rows={3}
                placeholder="Outline primary duties and responsibilities for this role..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as DesignationStatus)}
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
                {editingDesignation ? "Update Designation" : "Save Designation"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW DESIGNATION DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingDesignation)}
        onClose={() => setViewingDesignation(null)}
        title="Designation Master Details"
        icon={<Award className="h-5 w-5 text-emerald-700" />}
      >
        {viewingDesignation && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingDesignation.designationCode}</span>
              <h3 className="text-base font-black text-amber-400">{viewingDesignation.designationTitle}</h3>
              <StatusBadge status={viewingDesignation.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Department &amp; Hierarchy</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Department:</span>
                <strong className="text-slate-900">{viewingDesignation.department}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Job Grade:</span>
                <strong className="text-emerald-900">{viewingDesignation.jobGrade}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Active Employees:</span>
                <strong className="text-blue-900">{viewingDesignation.employeeCount} Staff</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Role Description</span>
              <p className="text-slate-700 leading-relaxed">{viewingDesignation.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Designation Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Departments</option>
              {deptNames.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
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
