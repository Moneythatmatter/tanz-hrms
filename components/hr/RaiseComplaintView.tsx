"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AlertCircle,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  Paperclip,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
  Send,
  Eye,
  Filter,
  User,
  Building2,
  Calendar,
  Upload,
  Info,
  RefreshCw,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import {
  hrComplaintService,
  hrEmployeeService,
  hrComplaintCategoryService,
} from "@/services/human-resources";
import {
  mapComplaintToGrievance,
  mapComplaintToApi,
  mapEmployeeFromApi,
} from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";

export type GrievanceStatus = "Open" | "In Review" | "Resolved" | "Escalated" | "Closed";
export type GrievancePriority = "Low" | "Medium" | "High" | "Critical";

export interface GrievanceComplaint {
  id: string;
  ticketNo: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  category: string;
  subject: string;
  description: string;
  incidentDate: string;
  priority: GrievancePriority;
  status: GrievanceStatus;
  submittedDate: string;
  isAnonymous: boolean;
  assignedTo?: string;
  attachmentName?: string;
  resolutionNotes?: string;
}

// 16 Default Active Categories matching ComplaintCategoriesView master
const ACTIVE_CATEGORIES = [
  "Payroll & Salary Issues",
  "Attendance Issues",
  "Leave Related Issues",
  "Shift Scheduling Issues",
  "Overtime Issues",
  "Manager Complaint",
  "Team Conflict",
  "Workplace Harassment",
  "Sexual Harassment (POSH)",
  "Discrimination",
  "Workplace Safety",
  "Policy Violation",
  "Facilities & Infrastructure",
  "IT/System Issues",
  "Workload Concerns",
  "Other",
];

export function RaiseComplaintView() {
  const [complaints, setComplaints] = useState<GrievanceComplaint[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(ACTIVE_CATEGORIES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadComplaints = async () => {
    try {
      const [rows, empRows, catRows] = await Promise.all([
        hrComplaintService.list().catch(() => []),
        hrEmployeeService.list().catch(() => []),
        hrComplaintCategoryService.list().catch(() => []),
      ]);

      const mappedEmps = (empRows as Record<string, unknown>[]).map(mapEmployeeFromApi);
      setEmployees(mappedEmps);

      if (Array.isArray(catRows) && catRows.length > 0) {
        const dynamicCats = catRows
          .map((c) => String(c.categoryName || c.category_name || c.name || "").trim())
          .filter(Boolean);
        if (dynamicCats.length > 0) {
          setAvailableCategories(Array.from(new Set([...dynamicCats, ...ACTIVE_CATEGORIES])));
        }
      }

      const empLookup = new Map(mappedEmps.map((e) => [e.id, e]));
      setComplaints(
        (rows as Record<string, unknown>[]).map((row) =>
          mapComplaintToGrievance(row, empLookup.get(String(row.employeeId || row.employee_id))),
        ),
      );
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load complaints");
      setComplaints([]);
    }
  };

  useEffect(() => {
    void loadComplaints();
  }, []);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [viewingComplaint, setViewingComplaint] = useState<GrievanceComplaint | null>(null);

  // Form State for Raising New Complaint
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formCategory, setFormCategory] = useState(ACTIVE_CATEGORIES[0]);
  const [formSubject, setFormSubject] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIncidentDate, setFormIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [formPriority, setFormPriority] = useState<GrievancePriority>("Medium");
  const [formIsAnonymous, setFormIsAnonymous] = useState(false);
  const [formAttachment, setFormAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KPI Metrics
  const stats = useMemo(() => {
    const total = complaints.length;
    const open = complaints.filter((c) => c.status === "Open" || c.status === "In Review").length;
    const resolved = complaints.filter((c) => c.status === "Resolved" || c.status === "Closed").length;
    const escalated = complaints.filter((c) => c.status === "Escalated" || c.priority === "Critical").length;

    return { total, open, resolved, escalated };
  }, [complaints]);

  // Filtered List
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        c.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === "ALL" || c.category === categoryFilter;
      const matchStatus = statusFilter === "ALL" || c.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [complaints, searchTerm, categoryFilter, statusFilter]);

  // Submit Complaint Handler
  const handleRaiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!formEmployeeId && !formIsAnonymous) {
      alert("Please select the employee filing the grievance.");
      return;
    }

    if (!formSubject.trim() || !formDescription.trim()) {
      alert("Please provide both a subject line and description of your grievance.");
      return;
    }

    const selectedEmp = employees.find((e) => e.id === formEmployeeId);
    setIsSubmitting(true);

    try {
      const created = await hrComplaintService.create(
        mapComplaintToApi({
          employeeId: formEmployeeId || undefined,
          employeeName: selectedEmp?.name,
          department: selectedEmp?.department,
          designation: selectedEmp?.designation,
          category: formCategory,
          subject: formSubject.trim(),
          description: formDescription.trim(),
          incidentDate: formIncidentDate,
          priority: formPriority,
          status: "Open",
          isAnonymous: formIsAnonymous,
          attachmentName: formAttachment ? formAttachment.name : undefined,
        }),
      );
      await loadComplaints();
      setIsRaiseModalOpen(false);
      setFormEmployeeId("");
      setFormSubject("");
      setFormDescription("");
      setFormIsAnonymous(false);
      setFormAttachment(null);
      const ticketNum = String(
        (created as Record<string, unknown>).ticketNo ||
          (created as Record<string, unknown>).ticket_no ||
          "",
      );
      setToastMessage(
        `Grievance submitted successfully! Ticket #${ticketNum} created in Supabase.`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Grievances"
      title="Raise Complaint"
      description="Submit employee grievances, confidential concerns, or workplace issues for HR redressal and tracking."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Grievances" },
        { label: "Raise Complaint" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={() => setIsRaiseModalOpen(true)}
          className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Raise New Complaint
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: REUSABLE KPI DASHBOARD CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Grievances"
          value={`${stats.total}`}
          subtitle="Submitted Tickets"
          tone="blue"
          icon={<FileText className="h-5 w-5" />}
        />
        <HRKPICard
          label="Open / In Review"
          value={`${stats.open}`}
          subtitle="Active Investigations"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Resolved Tickets"
          value={`${stats.resolved}`}
          subtitle="Redressed &amp; Closed"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Escalated / Critical"
          value={`${stats.escalated}`}
          subtitle="High Severity Action"
          tone="rose"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS & SEARCH TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Ticket, Subject, Employee..."
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
                {ACTIVE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">🟡 Open</option>
                <option value="In Review">🔵 In Review</option>
                <option value="Resolved">🟢 Resolved</option>
                <option value="Escalated">🔴 Escalated</option>
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
                <th className="py-3.5 px-4">Ticket No</th>
                <th className="py-3.5 px-4">Complainant</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingComplaint(c)}
                  >
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                      {c.ticketNo}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.isAnonymous ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            AE
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Anonymous</p>
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                              Confidential
                            </span>
                          </div>
                        </div>
                      ) : (
                        <HREmployeeCell
                          name={c.employeeName}
                          id={c.employeeId}
                          avatar={c.avatar}
                          photoUrl={c.photoUrl}
                        />
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {c.category}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-bold text-slate-900 truncate">{c.subject}</p>
                      <p className="text-[11px] text-slate-500 truncate">{c.description}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          c.priority === "Critical"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : c.priority === "High"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : c.priority === "Medium"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {c.submittedDate}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setViewingComplaint(c)}
                        className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No complaints found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredComplaints.map((c) => (
          <div
            key={c.id}
            onClick={() => setViewingComplaint(c)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-slate-900 text-xs">{c.ticketNo}</span>
              <StatusBadge status={c.status} />
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{c.subject}</h4>
              <span className="text-xs font-medium text-emerald-800">{c.category}</span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>Submitted: {c.submittedDate}</span>
              <span className="font-bold text-slate-700">Priority: {c.priority}</span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setViewingComplaint(c);
              }}
              className="w-full text-xs font-bold text-slate-700"
            >
              View Ticket Details
            </Button>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RAISE NEW COMPLAINT FORM
      ───────────────────────────────────────────────────────────── */}
      {isRaiseModalOpen && (
        <Modal
          isOpen={isRaiseModalOpen}
          onClose={() => setIsRaiseModalOpen(false)}
          title="Raise Grievance / Complaint"
          description="Submit a detailed grievance to HR for review. Select the employee filing the grievance, or opt for anonymous submission."
          size="lg"
        >
          <form onSubmit={handleRaiseSubmit} className="space-y-4 text-xs">
            {/* Select Employee */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Employee / Complainant {!formIsAnonymous && <span className="text-rose-500">*</span>}
              </label>
              <select
                value={formEmployeeId}
                onChange={(e) => setFormEmployeeId(e.target.value)}
                required={!formIsAnonymous}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.empCode}) • {emp.designation} - {emp.department}
                  </option>
                ))}
              </select>
              {formIsAnonymous && (
                <p className="mt-1 text-[11px] text-amber-700 font-medium">
                  Anonymous mode active: The selected employee identity will remain confidential in investigations.
                </p>
              )}
            </div>

            {/* Category Select */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Grievance Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Subject Line <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary of the issue (e.g. Missing Overtime Pay for July)"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Incident Date & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date of Incident</label>
                <input
                  type="date"
                  value={formIncidentDate}
                  onChange={(e) => setFormIncidentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as GrievancePriority)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                >
                  <option value="Low">Low (General Concern)</option>
                  <option value="Medium">Medium (Standard HR Issue)</option>
                  <option value="High">High (Urgent Attention)</option>
                  <option value="Critical">Critical (Immediate Escalation)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Detailed Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide clear facts, location, names of personnel involved, and specific details..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* File Attachment */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Attach Supporting Proof / Document (Optional)</label>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <Upload className="h-5 w-5 text-slate-400" />
                <input
                  type="file"
                  onChange={(e) => setFormAttachment(e.target.files ? e.target.files[0] : null)}
                  className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold text-amber-950 block text-xs">Submit Anonymously</span>
                <p className="text-[11px] text-amber-800">Your name and employee ID will be hidden from the investigation log.</p>
              </div>
              <input
                type="checkbox"
                checked={formIsAnonymous}
                onChange={(e) => setFormIsAnonymous(e.target.checked)}
                className="h-5 w-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setIsRaiseModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Submit Grievance
                  </>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: VIEW COMPLAINT DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingComplaint)}
        onClose={() => setViewingComplaint(null)}
        title="Grievance Ticket Details"
        icon={<FileText className="h-5 w-5 text-blue-600" />}
      >
        {viewingComplaint && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono font-bold">{viewingComplaint.ticketNo}</span>
                <StatusBadge status={viewingComplaint.status} />
              </div>
              <h3 className="text-base font-black text-amber-400">{viewingComplaint.subject}</h3>
              <p className="text-xs text-slate-300">Category: <strong>{viewingComplaint.category}</strong></p>
            </div>

            {/* Complainant Profile */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Complainant Details</span>
              {viewingComplaint.isAnonymous ? (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center font-bold text-xs">AE</div>
                  <div>
                    <p className="font-bold text-slate-900">Anonymous Employee</p>
                    <span className="text-[10px] text-amber-700 font-bold">Identity Protected</span>
                  </div>
                </div>
              ) : (
                <HREmployeeCell
                  name={viewingComplaint.employeeName}
                  id={viewingComplaint.employeeId}
                  avatar={viewingComplaint.avatar}
                  photoUrl={viewingComplaint.photoUrl}
                  department={viewingComplaint.department}
                />
              )}
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Statement &amp; Facts</span>
              <p className="text-slate-700 leading-relaxed font-medium">{viewingComplaint.description}</p>
              {viewingComplaint.attachmentName && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-blue-700 font-bold">
                  <Paperclip className="h-4 w-4" />
                  <span>Attachment: {viewingComplaint.attachmentName}</span>
                </div>
              )}
            </div>

            {/* Assigned & Resolution */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="font-extrabold text-blue-950 block uppercase text-[11px]">Redressal &amp; Investigation</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Assigned Officer:</span>
                <strong className="text-slate-900">{viewingComplaint.assignedTo || "Unassigned"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Priority:</span>
                <strong className="text-slate-900">{viewingComplaint.priority}</strong>
              </div>
              {viewingComplaint.resolutionNotes && (
                <div className="pt-2 border-t border-blue-200">
                  <span className="font-bold text-emerald-900 block">Resolution Notes:</span>
                  <p className="text-slate-700 italic">{viewingComplaint.resolutionNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Grievance Filters"
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
              {ACTIVE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
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
