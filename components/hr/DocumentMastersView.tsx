"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileCog,
  Plus,
  Trash2,
  Edit2,
  FolderOpen,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  ShieldCheck,
  Calendar,
  X,
  Filter,
  Check,
  Printer,
  Sparkles,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  hrDocumentCategoryService,
  hrDocumentTypeService,
} from "@/services/human-resources";
import {
  buildIdNameMap,
  mapDocumentCategoryFromApi,
  mapDocumentCategoryToApi,
  mapDocumentTypeFromApi,
  mapDocumentTypeToApi,
} from "@/lib/hr/api-mappers";

export interface MasterCategory {
  id: string;
  name: string;
  description: string;
  isMandatory: boolean;
}

export interface MasterDocumentType {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  requiresExpiry: boolean;
  isMandatory: boolean;
  description?: string;
}

export function DocumentMastersView() {
  const [categories, setCategories] = useState<MasterCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<MasterDocumentType[]>([]);
  const [activeTab, setActiveTab] = useState<"categories" | "types">("categories");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadDocumentMasters = async () => {
    try {
      const [catRows, typeRows] = await Promise.all([
        hrDocumentCategoryService.list(),
        hrDocumentTypeService.list(),
      ]);
      const mappedCategories = catRows.map(mapDocumentCategoryFromApi);
      const categoryNameById = buildIdNameMap(catRows, "name");
      setCategories(mappedCategories);
      setDocumentTypes(
        typeRows.map((row) =>
          mapDocumentTypeFromApi(row, categoryNameById.get(String(row.categoryId)) ?? ""),
        ),
      );
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load document masters");
      setCategories([]);
      setDocumentTypes([]);
    }
  };

  useEffect(() => {
    void loadDocumentMasters();
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Modals state
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MasterCategory | null>(null);
  
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<MasterDocumentType | null>(null);
  const [prefilledCatIdForType, setPrefilledCatIdForType] = useState<string | null>(null);

  // Category Form State
  const [catNameInput, setCatNameInput] = useState("");
  const [catDescInput, setCatDescInput] = useState("");
  const [catMandatoryInput, setCatMandatoryInput] = useState(true);

  // Document Type Form State
  const [typeNameInput, setTypeNameInput] = useState("");
  const [typeCatIdInput, setTypeCatIdInput] = useState("");
  const [typeExpiryInput, setTypeExpiryInput] = useState(false);
  const [typeMandatoryInput, setTypeMandatoryInput] = useState(true);

  // Filtered Document Types
  const filteredDocTypes = useMemo(() => {
    return documentTypes.filter((dt) => {
      const matchSearch = dt.name.toLowerCase().includes(searchTerm.toLowerCase()) || dt.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategoryFilter === "ALL" || dt.categoryId === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [documentTypes, searchTerm, selectedCategoryFilter]);

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatNameInput("");
    setCatDescInput("");
    setCatMandatoryInput(true);
    setIsAddCatModalOpen(true);
  };

  const handleOpenEditCategory = (cat: MasterCategory) => {
    setEditingCategory(cat);
    setCatNameInput(cat.name);
    setCatDescInput(cat.description);
    setCatMandatoryInput(cat.isMandatory);
    setIsAddCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameInput.trim()) return;

    // Check duplicate name
    const exists = categories.some(
      (c) => c.name.toLowerCase() === catNameInput.trim().toLowerCase() && c.id !== editingCategory?.id
    );
    if (exists) {
      setToastMessage(`Category "${catNameInput.trim()}" already exists! No duplicate categories allowed.`);
      return;
    }

    const payload = mapDocumentCategoryToApi({
      name: catNameInput.trim(),
      description: catDescInput.trim() || "Master document compliance category",
      isMandatory: catMandatoryInput,
    });

    try {
      if (editingCategory) {
        await hrDocumentCategoryService.update(editingCategory.id, payload);
        setToastMessage(`Updated document category "${catNameInput.trim()}".`);
      } else {
        await hrDocumentCategoryService.create(payload);
        setToastMessage(
          `Created new category "${catNameInput.trim()}". Automatically available for all employees!`,
        );
      }
      await loadDocumentMasters();
      setIsAddCatModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    try {
      await hrDocumentCategoryService.remove(catId);
      await loadDocumentMasters();
      setToastMessage(`Deleted category "${catName}" and associated document types.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  // Document Type Handlers
  const handleOpenAddType = (prefilledCatId?: string) => {
    setEditingType(null);
    setTypeNameInput("");
    setTypeCatIdInput(prefilledCatId || categories[0]?.id || "");
    setTypeExpiryInput(false);
    setTypeMandatoryInput(true);
    setIsAddTypeModalOpen(true);
  };

  const handleOpenEditType = (dt: MasterDocumentType) => {
    setEditingType(dt);
    setTypeNameInput(dt.name);
    setTypeCatIdInput(dt.categoryId);
    setTypeExpiryInput(dt.requiresExpiry);
    setTypeMandatoryInput(dt.isMandatory);
    setIsAddTypeModalOpen(true);
  };

  const handleSaveDocumentType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeNameInput.trim() || !typeCatIdInput) return;

    const catObj = categories.find((c) => c.id === typeCatIdInput);
    if (!catObj) return;

    // Check duplicate
    const exists = documentTypes.some(
      (dt) =>
        dt.name.toLowerCase() === typeNameInput.trim().toLowerCase() &&
        dt.categoryId === typeCatIdInput &&
        dt.id !== editingType?.id
    );

    if (exists) {
      setToastMessage(`Document type "${typeNameInput.trim()}" already exists in ${catObj.name}.`);
      return;
    }

    const payload = mapDocumentTypeToApi({
      categoryId: catObj.id,
      name: typeNameInput.trim(),
      requiresExpiry: typeExpiryInput,
      isMandatory: typeMandatoryInput,
    });

    try {
      if (editingType) {
        await hrDocumentTypeService.update(editingType.id, payload);
        setToastMessage(`Updated document type "${typeNameInput.trim()}".`);
      } else {
        await hrDocumentTypeService.create(payload);
        setToastMessage(`Added "${typeNameInput.trim()}" to ${catObj.name}.`);
      }
      await loadDocumentMasters();
      setIsAddTypeModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save document type");
    }
  };

  const handleDeleteType = async (typeId: string, typeName: string) => {
    try {
      await hrDocumentTypeService.remove(typeId);
      await loadDocumentMasters();
      setToastMessage(`Deleted document type "${typeName}".`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to delete document type");
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Masters"
      title="Document Masters"
      description="Configure organizational document hierarchy, master categories, and document types for employee compliance across the property."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Masters" },
        { label: "Document Masters" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "categories" ? (
            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddCategory}
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Category
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => handleOpenAddType()}
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Document Type
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Structure
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          ORGANIZATION MASTER OVERVIEW BANNER
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-4 sm:p-5 text-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/20 text-emerald-300 shrink-0">
              <FileCog className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">Global Organizational Document Engine</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full">
                  System Master
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Configure document categories &amp; requirements. Newly added categories dynamically apply to all {categories.length} document structures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs bg-white/10 p-2.5 rounded-xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Categories</span>
              <span className="text-lg font-black text-white">{categories.length}</span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-center px-2">
              <span className="text-[10px] text-emerald-200 uppercase font-bold block">Document Types</span>
              <span className="text-lg font-black text-white">{documentTypes.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB NAVIGATION (Tab 1 — Categories vs Tab 2 — Document Types)
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex border-b border-slate-200 space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={cn(
            "pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === "categories"
              ? "border-emerald-700 text-emerald-800 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <FolderOpen className="h-4 w-4" />
          <span>Tab 1 — Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("types")}
          className={cn(
            "pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2",
            activeTab === "types"
              ? "border-emerald-700 text-emerald-800 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Tab 2 — Document Types ({documentTypes.length})</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CATEGORIES MANAGEMENT VIEW
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Master Document Categories</h3>
              <p className="text-xs text-slate-500">
                Categories defined here determine document grouping across Employee Profiles &amp; Document Management.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddCategory}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const typesInCat = documentTypes.filter((dt) => dt.categoryId === cat.id);
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-emerald-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                          <FolderOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {typesInCat.length} Document Types Configured
                          </span>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          cat.isMandatory
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {cat.isMandatory ? "Mandatory" : "Optional"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3">{cat.description}</p>

                    {/* Document Types Pill List */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Included Document Types:
                      </span>
                      {typesInCat.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No document types added yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {typesInCat.map((dt) => (
                            <span
                              key={dt.id}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-medium text-slate-700 flex items-center gap-1"
                            >
                              • {dt.name}
                              {dt.requiresExpiry && (
                                <span className="text-orange-600 font-bold" title="Requires Expiry Date">
                                  ⌛
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenAddType(cat.id)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Document Type
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="Edit Category"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Category"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DOCUMENT TYPES MANAGEMENT VIEW
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "types" && (
        <div className="space-y-4">
          {/* Toolbar: Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Document Type Name or Category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleOpenAddType()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Document Type
                </Button>
              </div>
            </div>
          </div>

          {/* Document Types Master Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Document Type Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Requires Expiry Date</th>
                    <th className="py-3 px-4">Compliance Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocTypes.map((dt) => (
                    <tr key={dt.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span>{dt.name}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                          {dt.categoryName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium">
                        {dt.requiresExpiry ? (
                          <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                            ⌛ Yes (Tracks Expiry)
                          </span>
                        ) : (
                          <span className="text-slate-400">No Expiry Required</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                            dt.isMandatory
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {dt.isMandatory ? "Mandatory for Onboarding" : "Optional"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditType(dt)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Document Type"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteType(dt.id, dt.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Document Type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ADD / EDIT MASTER CATEGORY
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddCatModalOpen}
        onClose={() => setIsAddCatModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : "Add Master Category"}
        description="Categories automatically configure the document vault for all employees across the property."
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Identity Proof, Financial Documents"
              value={catNameInput}
              onChange={(e) => setCatNameInput(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Scope</label>
            <textarea
              rows={2}
              placeholder="Brief description of documents included in this category..."
              value={catDescInput}
              onChange={(e) => setCatDescInput(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="catMandatoryToggle"
              checked={catMandatoryInput}
              onChange={(e) => setCatMandatoryInput(e.target.checked)}
              className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
            />
            <label htmlFor="catMandatoryToggle" className="text-xs font-semibold text-slate-700">
              Mandatory Category for Employee Onboarding
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddCatModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ADD / EDIT MASTER DOCUMENT TYPE
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddTypeModalOpen}
        onClose={() => setIsAddTypeModalOpen(false)}
        title={editingType ? `Edit Document Type: ${editingType.name}` : "Add Document Type"}
        description="Add a specific required document item inside a category."
        size="md"
      >
        <form onSubmit={handleSaveDocumentType} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={typeCatIdInput}
              onChange={(e) => setTypeCatIdInput(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Aadhaar Card, Passport, Medical Fitness"
              value={typeNameInput}
              onChange={(e) => setTypeNameInput(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="typeExpiryToggle"
                checked={typeExpiryInput}
                onChange={(e) => setTypeExpiryInput(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <label htmlFor="typeExpiryToggle" className="text-xs font-semibold text-slate-700">
                Requires Expiry Date Tracking (e.g. Passport, License, Medical, Police Check)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="typeMandatoryToggle"
                checked={typeMandatoryInput}
                onChange={(e) => setTypeMandatoryInput(e.target.checked)}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
              />
              <label htmlFor="typeMandatoryToggle" className="text-xs font-semibold text-slate-700">
                Mandatory Requirement for Employee Compliance
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddTypeModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Save Document Type
            </Button>
          </div>
        </form>
      </Modal>
    </ModulePageShell>
  );
}
