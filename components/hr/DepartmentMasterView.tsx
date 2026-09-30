"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
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
  UserCheck,
  Building,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrDepartmentService } from "@/services/human-resources";
import { mapDepartmentFromApi, mapDepartmentToApi } from "@/lib/hr/api-mappers";

export type DepartmentStatus = "Active" | "Inactive";

export interface DepartmentMaster {
  id: string;
  deptCode: string;
  departmentName: string;
  headOfDepartment: string;
  headEmail?: string;
  location?: string;
  description: string;
  status: DepartmentStatus;
  createdDate: string;
  employeeCount: number;
}

export function DepartmentMasterView() {
  const [departments, setDepartments] = useState<DepartmentMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const rows = await hrDepartmentService.list();
      setDepartments(rows.map(mapDepartmentFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentMaster | null>(null);
  const [viewingDept, setViewingDept] = useState<DepartmentMaster | null>(null);

  // Form Fields
  const [formDeptCode, setFormDeptCode] = useState("");
  const [formDeptName, setFormDeptName] = useState("");
  const [formHeadName, setFormHeadName] = useState("");
  const [formHeadEmail, setFormHeadEmail] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<DepartmentStatus>("Active");
  const [codeError, setCodeError] = useState("");
  const [nameError, setNameError] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.status === "Active").length;
    const inactive = departments.filter((d) => d.status === "Inactive").length;
    const totalEmployees = departments.reduce((sum, d) => sum + d.employeeCount, 0);
    return { total, active, inactive, totalEmployees };
  }, [departments]);

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchSearch =
        d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.deptCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.headOfDepartment.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingDept(null);
    setFormDeptCode(`DEP-${Math.floor(10 + Math.random() * 90)}`);
    setFormDeptName("");
    setFormHeadName("");
    setFormHeadEmail("");
    setFormLocation("");
    setFormDescription("");
    setFormStatus("Active");
    setCodeError("");
    setNameError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (dept: DepartmentMaster) => {
    setEditingDept(dept);
    setFormDeptCode(dept.deptCode);
    setFormDeptName(dept.departmentName);
    setFormHeadName(dept.headOfDepartment);
    setFormHeadEmail(dept.headEmail || "");
    setFormLocation(dept.location || "");
    setFormDescription(dept.description);
    setFormStatus(dept.status);
    setCodeError("");
    setNameError("");
    setIsModalOpen(true);
  };

  // Save Department (Validation for duplicate names & codes)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setNameError("");

    const trimmedName = formDeptName.trim();
    const trimmedCode = formDeptCode.trim();

    if (!trimmedName) {
      setNameError("Department Name is required.");
      return;
    }

    if (!trimmedCode) {
      setCodeError("Department Code is required.");
      return;
    }

    const isDuplicateName = departments.some(
      (d) =>
        d.departmentName.toLowerCase() === trimmedName.toLowerCase() &&
        (!editingDept || d.id !== editingDept.id)
    );

    if (isDuplicateName) {
      setNameError(`A department named "${trimmedName}" already exists.`);
      return;
    }

    const payload = mapDepartmentToApi({
      deptCode: trimmedCode,
      departmentName: trimmedName,
      headOfDepartment: formHeadName.trim() || "Unassigned",
      headEmail: formHeadEmail.trim(),
      location: formLocation.trim(),
      description: formDescription.trim(),
      status: formStatus,
    });

    try {
      if (editingDept) {
        await hrDepartmentService.update(editingDept.id, payload);
        setToastMessage(`Updated department "${trimmedName}".`);
      } else {
        await hrDepartmentService.create(payload);
        setToastMessage(`Created department "${trimmedName}".`);
      }
      await loadDepartments();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save department");
    }
  };

  const handleToggleStatus = async (dept: DepartmentMaster) => {
    const nextStatus: DepartmentStatus = dept.status === "Active" ? "Inactive" : "Active";
    try {
      await hrDepartmentService.update(dept.id, { status: nextStatus });
      await loadDepartments();
      setToastMessage(`Department "${dept.departmentName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteDepartment = async (dept: DepartmentMaster) => {
    if (dept.employeeCount > 0) {
      alert(
        `Cannot delete "${dept.departmentName}" because it has ${dept.employeeCount} active employee(s) assigned to it.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete department "${dept.departmentName}"?`)) {
      try {
        await hrDepartmentService.remove(dept.id);
        if (viewingDept?.id === dept.id) setViewingDept(null);
        await loadDepartments();
        setToastMessage(`Deleted department "${dept.departmentName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete department");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Departments"
      description="Configure enterprise department structures, department heads, physical locations, and employee assignments."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Departments" },
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
          Add Department
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Departments"
          value={`${stats.total}`}
          subtitle="Master Enterprise Units"
          tone="blue"
          icon={<Building2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Units"
          value={`${stats.active}`}
          subtitle="Operational Departments"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Inactive Units"
          value={`${stats.inactive}`}
          subtitle="Disabled / Archived"
          tone="rose"
          icon={<XCircle className="h-5 w-5" />}
        />
        <HRKPICard
          label="Assigned Workforce"
          value={`${stats.totalEmployees}`}
          subtitle="Salaried Employees"
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
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Department or Head..."
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

            {/* Desktop Status Filter */}
            <div className="hidden sm:flex items-center gap-2">
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
                  setStatusFilter("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset Filters
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
                <th className="py-3.5 px-4">Department Name</th>
                <th className="py-3.5 px-4">Head of Dept (HOD)</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Assigned Employees</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDepartments.length > 0 ? (
                filteredDepartments.map((dept) => (
                  <tr
                    key={dept.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingDept(dept)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{dept.departmentName}</p>
                          <span className="text-[11px] text-slate-400 font-mono">{dept.deptCode}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{dept.headOfDepartment}</p>
                      {dept.headEmail && <p className="text-[11px] text-slate-400">{dept.headEmail}</p>}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {dept.location || "Main Premises"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        👥 {dept.employeeCount} Staff
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={dept.status} />
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
                          onClick={() => setViewingDept(dept)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(dept)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(dept)}
                          className={`rounded-xl text-xs font-semibold ${
                            dept.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {dept.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept)}
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
                    No departments found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredDepartments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingDept(dept)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{dept.deptCode}</span>
                <h4 className="font-bold text-slate-900 text-sm">{dept.departmentName}</h4>
              </div>
              <StatusBadge status={dept.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">Head of Dept: <strong>{dept.headOfDepartment}</strong></p>
              <p className="text-slate-500">Location: {dept.location || "Main Hotel"}</p>
              <p className="text-slate-500">Workforce: <strong>{dept.employeeCount} Employees</strong></p>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(dept)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(dept)}
                className="text-xs font-semibold"
              >
                {dept.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteDepartment(dept)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT DEPARTMENT
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDept ? "Edit Department" : "Add Department"}
          description="Configure department information, code, and assign department head."
          size="md"
        >
          <form onSubmit={handleSaveDepartment} className="space-y-4 text-xs">
            {/* Dept Code & Dept Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Department Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FO-10"
                  value={formDeptCode}
                  onChange={(e) => {
                    setFormDeptCode(e.target.value);
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
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Front Office"
                  value={formDeptName}
                  onChange={(e) => {
                    setFormDeptName(e.target.value);
                    setNameError("");
                  }}
                  className={`w-full rounded-xl border p-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                    nameError ? "border-rose-400 focus:ring-rose-500" : "border-slate-200 focus:ring-emerald-600"
                  }`}
                />
                {nameError && <p className="text-[11px] text-rose-600 font-bold pt-1">{nameError}</p>}
              </div>
            </div>

            {/* Head of Dept & Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={formHeadName}
                  onChange={(e) => setFormHeadName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">HOD Contact Email</label>
                <input
                  type="email"
                  placeholder="e.g. rajesh@grandpalace.com"
                  value={formHeadEmail}
                  onChange={(e) => setFormHeadEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Physical Location / Office Deck</label>
              <input
                type="text"
                placeholder="e.g. Main Lobby - Floor 1"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Department responsibilities and key operations..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as DepartmentStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">🟢 Active (Operational Unit)</option>
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
                {editingDept ? "Update Department" : "Save Department"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW DEPARTMENT DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingDept)}
        onClose={() => setViewingDept(null)}
        title="Department Master Details"
        icon={<Building2 className="h-5 w-5 text-blue-600" />}
      >
        {viewingDept && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingDept.deptCode}</span>
              <h3 className="text-base font-black text-amber-400">{viewingDept.departmentName}</h3>
              <StatusBadge status={viewingDept.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Leadership &amp; Location</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Head of Dept:</span>
                <strong className="text-slate-900">{viewingDept.headOfDepartment}</strong>
              </div>
              {viewingDept.headEmail && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Email:</span>
                  <strong className="text-blue-900">{viewingDept.headEmail}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Location:</span>
                <strong className="text-slate-900">{viewingDept.location || "Main Premises"}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="font-extrabold text-blue-950 block uppercase">Workforce Stats</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Assigned Employees:</span>
                <strong className="text-blue-900">{viewingDept.employeeCount} Staff Members</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Created On:</span>
                <strong className="text-slate-900">{viewingDept.createdDate}</strong>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <span className="font-extrabold text-slate-900 block uppercase">Overview</span>
              <p className="text-slate-700 leading-relaxed">{viewingDept.description}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Department Filters"
      >
        <div className="space-y-4 text-xs">
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
