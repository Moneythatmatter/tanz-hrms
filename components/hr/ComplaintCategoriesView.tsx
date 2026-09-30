"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FolderKanban,
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
  Tag,
  AlertCircle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { hrComplaintCategoryService } from "@/services/human-resources";
import { mapComplaintCategoryFromApi, mapComplaintCategoryToApi } from "@/lib/hr/api-mappers";

export type ComplaintCategoryStatus = "Active" | "Inactive";

export type ReviewLevelRequirement = "Standard" | "Manager Review" | "Senior Management Review" | "Special Committee Review";

export interface ComplaintCategory {
  id: string;
  categoryName: string;
  description: string;
  reviewLevel: ReviewLevelRequirement;
  status: ComplaintCategoryStatus;
  createdDate: string;
  complaintsCount: number;
}

// 16 Default Categories with Configurable Review Levels
export function ComplaintCategoriesView() {
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const loadCategories = async () => {
    try {
      const rows = await hrComplaintCategoryService.list();
      setCategories(rows.map(mapComplaintCategoryFromApi));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load categories");
      setCategories([]);
    }
  };

  useEffect(() => { void loadCategories(); }, []);



  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ComplaintCategory | null>(null);
  const [viewingCategory, setViewingCategory] = useState<ComplaintCategory | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formReviewLevel, setFormReviewLevel] = useState<ReviewLevelRequirement>("Standard");
  const [formStatus, setFormStatus] = useState<ComplaintCategoryStatus>("Active");
  const [nameError, setNameError] = useState("");

  // Statistics Cards
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === "Active").length;
    const inactive = categories.filter((c) => c.status === "Inactive").length;
    return { total, active, inactive };
  }, [categories]);

  // Filtered List
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSearch =
        cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "ALL" || cat.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [categories, searchTerm, statusFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormReviewLevel("Standard");
    setFormStatus("Active");
    setNameError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (category: ComplaintCategory) => {
    setEditingCategory(category);
    setFormName(category.categoryName);
    setFormDescription(category.description);
    setFormReviewLevel(category.reviewLevel || "Standard");
    setFormStatus(category.status);
    setNameError("");
    setIsModalOpen(true);
  };

  // Save Form Handler (Duplicate check)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");

    if (!formName.trim()) {
      setNameError("Category name is required.");
      return;
    }

    // Check duplicate name
    const isDuplicate = categories.some(
      (c) =>
        c.categoryName.toLowerCase() === formName.trim().toLowerCase() &&
        c.id !== editingCategory?.id
    );

    if (isDuplicate) {
      setNameError("A category with this name already exists.");
      return;
    }

    const payload = mapComplaintCategoryToApi({
      categoryName: formName.trim(),
      description: formDescription.trim(),
      reviewLevel: formReviewLevel,
      status: formStatus,
    });

    try {
      if (editingCategory) {
        await hrComplaintCategoryService.update(editingCategory.id, payload);
        setToastMessage(`Category "${formName.trim()}" updated successfully.`);
      } else {
        await hrComplaintCategoryService.create(payload);
        setToastMessage(`Category "${formName.trim()}" created successfully.`);
      }
      await loadCategories();
      setIsModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleToggleStatus = async (category: ComplaintCategory) => {
    const nextStatus: ComplaintCategoryStatus = category.status === "Active" ? "Inactive" : "Active";
    try {
      await hrComplaintCategoryService.update(category.id, { status: nextStatus });
      await loadCategories();
      setToastMessage(`Category "${category.categoryName}" is now ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteCategory = async (category: ComplaintCategory) => {
    if (category.complaintsCount > 0) {
      alert(
        `Cannot delete "${category.categoryName}" because it has ${category.complaintsCount} recorded employee complaint(s). You may deactivate this category instead so it no longer appears when raising complaints.`
      );
      return;
    }

    if (confirm(`Are you sure you want to delete category "${category.categoryName}"?`)) {
      try {
        await hrComplaintCategoryService.remove(category.id);
        if (viewingCategory?.id === category.id) setViewingCategory(null);
        await loadCategories();
        setToastMessage(`Deleted category "${category.categoryName}".`);
      } catch (err) {
        setToastMessage(err instanceof Error ? err.message : "Failed to delete category");
      }
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Grievances"
      title="Complaint Categories"
      description="Configure grievance categories available to employees."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Grievances" },
        { label: "Complaint Categories" },
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
          Add Category
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: STATISTICS CARDS (Total, Active, Inactive)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <HRKPICard
          label="Total Categories"
          value={`${stats.total}`}
          subtitle="Master Grievance Categories"
          tone="blue"
          icon={<FolderKanban className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Categories"
          value={`${stats.active}`}
          subtitle="Available in Raise Complaint"
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
                placeholder="Search Category Name..."
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

            {/* Desktop Status Select Filter */}
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
          SECTION 3: MAIN DATA TABLE (DESKTOP) & STACKED CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Configured Review Level</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingCategory(cat)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">
                          <Tag className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{cat.categoryName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{cat.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 truncate">{cat.description || "No description provided."}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                        {cat.reviewLevel || "Standard"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={cat.status} />
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {cat.createdDate}
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
                          onClick={() => setViewingCategory(cat)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(cat)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(cat)}
                          className={`rounded-xl text-xs font-semibold ${
                            cat.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          {cat.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(cat)}
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
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                    No complaint categories found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            onClick={() => setViewingCategory(cat)}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">{cat.id}</span>
                <h4 className="font-bold text-slate-900 text-sm">{cat.categoryName}</h4>
              </div>
              <StatusBadge status={cat.status} />
            </div>

            <p className="text-xs text-slate-600">{cat.description}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
              <span>Created: {cat.createdDate}</span>
              <span>{cat.complaintsCount} Complaints Logged</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-2" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(cat)}
                className="text-xs font-semibold text-emerald-800 border-emerald-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(cat)}
                className="text-xs font-semibold"
              >
                {cat.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteCategory(cat)}
                className="text-xs font-semibold text-rose-700 border-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT COMPLAINT CATEGORY
      ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? "Edit Complaint Category" : "Add Complaint Category"}
          description="Create or update grievance master category available to employees."
          size="md"
        >
          <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
            {/* Category Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shift Scheduling Issues"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setNameError("");
                }}
                className={`w-full rounded-xl border p-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 ${
                  nameError
                    ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                    : "border-slate-200 focus:ring-emerald-600 bg-white"
                }`}
              />
              {nameError && (
                <p className="text-[11px] text-rose-600 font-bold pt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {nameError}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Describe what type of complaints fall under this category..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Configured Review Level */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Configured Review Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={formReviewLevel}
                onChange={(e) => setFormReviewLevel(e.target.value as ReviewLevelRequirement)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-purple-900 bg-purple-50/40 focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="Standard">Standard (1-Level Officer Review)</option>
                <option value="Manager Review">Manager Review (HR Manager Approval Required)</option>
                <option value="Senior Management Review">Senior Management Review (HR Manager + GM Review)</option>
                <option value="Special Committee Review">Special Committee Review (POSH / Internal Committee)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Determines the approval chain routing required for grievances filed under this category.
              </p>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as ComplaintCategoryStatus)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
              >
                <option value="Active">🟢 Active (Visible in Raise Complaint)</option>
                <option value="Inactive">⚪ Inactive (Hidden from employees)</option>
              </select>
            </div>

            {/* Form Actions */}
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
                {editingCategory ? "Update Category" : "Save Category"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW CATEGORY DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingCategory)}
        onClose={() => setViewingCategory(null)}
        title="Category Master Details"
        icon={<Tag className="h-5 w-5 text-blue-600" />}
      >
        {viewingCategory && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <span className="text-[10px] text-slate-400 font-mono font-bold block">{viewingCategory.id}</span>
              <h3 className="text-base font-black text-amber-400">{viewingCategory.categoryName}</h3>
              <StatusBadge status={viewingCategory.status} />
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase">Category Description</span>
              <p className="text-slate-700 leading-relaxed font-medium">
                {viewingCategory.description || "No specific description provided."}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="font-extrabold text-blue-950 block uppercase">Master Information</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Created Date:</span>
                <strong className="text-slate-900">{viewingCategory.createdDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Employee Complaints Logged:</span>
                <strong className="text-blue-900">{viewingCategory.complaintsCount} Complaints</strong>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Category Filters"
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
