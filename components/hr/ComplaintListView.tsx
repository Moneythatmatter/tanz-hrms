"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Search,
  Plus,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Eye,
  Edit2,
  UserCheck,
  MessageSquare,
  ChevronDown,
  Paperclip,
  Send,
  Building2,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Lock,
  UserX,
  FileCheck,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { cn } from "@/lib/utils";
import { hrComplaintService, hrEmployeeService } from "@/services/human-resources";
import { mapComplaintFromApi, mapEmployeeFromApi } from "@/lib/hr/api-mappers";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";

// ─────────────────────────────────────────────────────────────
// TYPES & WORKFLOW INTERFACES
// ─────────────────────────────────────────────────────────────

export type ComplaintWorkflowStatus =
  | "Open"
  | "Under Initial Review"
  | "Assigned"
  | "Under Investigation"
  | "Pending Level 1 Review"
  | "Pending Level 2 Review"
  | "Resolution Proposed"
  | "Pending Final Approval"
  | "Resolved"
  | "Closed"
  | "Rejected"
  | "Escalated";

export type ComplaintPriority = "Low" | "Medium" | "High" | "Critical";
export type ReviewLevelRequirement = "Standard" | "Manager Review" | "Senior Management Review" | "Special Committee Review";

export interface InvestigationNote {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  noteText: string;
  evidenceFiles?: string[];
}

export interface ReviewStepState {
  levelName: string; // e.g. "Level 1 — HR Manager Review"
  reviewer: string;
  status: "Pending" | "Approved" | "Returned" | "Escalated" | "Rejected" | "Not Required";
  comment?: string;
  timestamp?: string;
}

export interface GrievanceTimelineEvent {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  prevStatus?: string;
  newStatus?: string;
  comment?: string;
}

export interface ComplaintRecord {
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
  priority: ComplaintPriority;
  status: ComplaintWorkflowStatus;
  reviewLevel: ReviewLevelRequirement;
  submittedDate: string;
  dueDate: string;
  isAnonymous: boolean;
  isPoshOrConfidential: boolean;

  // Assignment
  assignedOfficer?: string;
  assignedRole?: string;
  assignedDate?: string;
  assignedBy?: string;

  // Investigation & Evidence
  investigationNotes: InvestigationNote[];
  evidenceDocuments: string[];

  // Multi-Level Review Chain
  reviewChain: ReviewStepState[];

  // Resolution Details
  proposedResolution?: string;
  resolutionNotes?: string;
  recommendedAction?: string;

  timeline: GrievanceTimelineEvent[];
}

const OFFICERS_LIST = [
  { name: "Neha Mehta", role: "HR Manager" },
  { name: "Sanjay Sharma", role: "Roster Supervisor / Dept Manager" },
  { name: "Rajiv Kapoor", role: "Head of Security / Safety Lead" },
  { name: "Anil Deshmukh", role: "Finance Lead" },
  { name: "POSH Internal Committee", role: "POSH Committee" },
  { name: "Vikram Malhotra", role: "Senior Management / GM" },
];

export function ComplaintListView() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const loadComplaints = async () => {
    try {
      const [rows, empRows] = await Promise.all([hrComplaintService.list(), hrEmployeeService.list()]);
      const lookup = new Map(empRows.map(mapEmployeeFromApi).map((e) => [e.id, e]));
      setComplaints(
        rows.map((row) =>
          mapComplaintFromApi(row, lookup.get(String(row.employeeId || row.employee_id))),
        ),
      );
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load complaints");
      setComplaints([]);
    }
  };

  useEffect(() => { void loadComplaints(); }, []);



  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPriority, setSelectedPriority] = useState("ALL");
  const [selectedOfficer, setSelectedOfficer] = useState("ALL");
  const [selectedReviewLevel, setSelectedReviewLevel] = useState("ALL");
  const [selectedSlaStatus, setSelectedSlaStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers
  const [viewingComplaint, setViewingComplaint] = useState<ComplaintRecord | null>(null);
  const [assigningComplaint, setAssigningComplaint] = useState<ComplaintRecord | null>(null);
  const [reviewingComplaint, setReviewingComplaint] = useState<ComplaintRecord | null>(null);
  const [addingNoteComplaint, setAddingNoteComplaint] = useState<ComplaintRecord | null>(null);

  // Form States
  const [assignOfficerObj, setAssignOfficerObj] = useState(OFFICERS_LIST[0]);
  const [assignNotes, setAssignNotes] = useState("");

  const [reviewDecision, setReviewDecision] = useState<"Approve" | "Return" | "Escalate" | "Reject">("Approve");
  const [reviewComment, setReviewComment] = useState("");
  const [escalateToOfficer, setEscalateToOfficer] = useState("Vikram Malhotra (GM)");

  const [newNoteText, setNewNoteText] = useState("");

  // Statistics KPI
  const stats = useMemo(() => {
    const total = complaints.length;
    const openOrInitial = complaints.filter((c) => c.status === "Open" || c.status === "Under Initial Review").length;
    const underInvestigation = complaints.filter((c) => c.status === "Under Investigation" || c.status === "Assigned").length;
    const pendingReview = complaints.filter((c) => c.status.startsWith("Pending") || c.status === "Resolution Proposed").length;
    const resolved = complaints.filter((c) => c.status === "Resolved" || c.status === "Closed").length;
    const escalatedOrCritical = complaints.filter((c) => c.status === "Escalated" || c.priority === "Critical").length;

    return { total, openOrInitial, underInvestigation, pendingReview, resolved, escalatedOrCritical };
  }, [complaints]);

  // SLA Calculation Helper
  const getSLAInfo = (c: ComplaintRecord) => {
    if (c.status === "Closed" || c.status === "Resolved") {
      return { text: "Completed", status: "NORMAL", badgeClass: "bg-slate-100 text-slate-700" };
    }
    const today = new Date();
    const due = new Date(c.dueDate.split("/").reverse().join("-"));
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { text: `🔴 SLA Breached (${Math.abs(diffDays)}d overdue)`, status: "BREACHED", badgeClass: "bg-rose-100 text-rose-800 border-rose-300 font-black" };
    } else if (diffDays <= 2) {
      return { text: `⚠️ SLA At Risk (${diffDays}d left)`, status: "AT_RISK", badgeClass: "bg-amber-100 text-amber-900 border-amber-300 font-bold" };
    }
    return { text: `${diffDays} Days Remaining`, status: "NORMAL", badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200" };
  };

  // Filtered Records
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchSearch =
        c.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === "ALL" || c.department === selectedDept;
      const matchCategory = selectedCategory === "ALL" || c.category === selectedCategory;
      const matchStatus = selectedStatus === "ALL" || c.status === selectedStatus;
      const matchPriority = selectedPriority === "ALL" || c.priority === selectedPriority;
      const matchOfficer = selectedOfficer === "ALL" || c.assignedOfficer === selectedOfficer;
      const matchReview = selectedReviewLevel === "ALL" || c.reviewLevel === selectedReviewLevel;
      
      const sla = getSLAInfo(c);
      const matchSla = selectedSlaStatus === "ALL" || sla.status === selectedSlaStatus;

      return matchSearch && matchDept && matchCategory && matchStatus && matchPriority && matchOfficer && matchReview && matchSla;
    });
  }, [complaints, searchTerm, selectedDept, selectedCategory, selectedStatus, selectedPriority, selectedOfficer, selectedReviewLevel, selectedSlaStatus]);

  // Handlers
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;

    const timestamp = new Date().toLocaleString("en-GB");
    const newTimelineEntry: GrievanceTimelineEvent = {
      id: `TL-${Math.floor(10 + Math.random() * 90)}`,
      timestamp,
      user: "Neha Mehta",
      role: "HR Manager",
      action: `Assigned Officer: ${assignOfficerObj.name} (${assignOfficerObj.role})`,
      prevStatus: assigningComplaint.status,
      newStatus: "Assigned",
      comment: assignNotes ? assignNotes.trim() : undefined,
    };

    const updatedTimeline = [newTimelineEntry, ...(assigningComplaint.timeline || [])];

    try {
      await hrComplaintService.update(assigningComplaint.id, {
        assignedOfficer: assignOfficerObj.name,
        assignedRole: assignOfficerObj.role,
        assignedDate: new Date().toLocaleDateString("en-GB"),
        assignedBy: "Neha Mehta (HR Manager)",
        status: "Assigned",
        timeline: updatedTimeline,
      });
      await loadComplaints();
      setAssigningComplaint(null);
      setAssignNotes("");
      setToastMessage(`Assigned complaint #${assigningComplaint.ticketNo} to ${assignOfficerObj.name}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to assign complaint");
    }
  };

  const [targetNextStatus, setTargetNextStatus] = useState<"Under Investigation" | "Pending Level 1 Review" | "Resolution Proposed">("Under Investigation");
  const [proposedResolutionInput, setProposedResolutionInput] = useState("");

  // Add Investigation Note Submit
  const handleAddInvestigationNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingNoteComplaint || !newNoteText.trim()) return;

    const timestamp = new Date().toLocaleString("en-GB");
    const newNote: InvestigationNote = {
      id: `INV-${Math.floor(10 + Math.random() * 90)}`,
      author: "Neha Mehta",
      authorRole: "HR Manager",
      timestamp,
      noteText: newNoteText.trim(),
    };

    const nextStatus = targetNextStatus;

    // Check if category requires Level 1 approval chain
    const updatedReviewChain = [...(addingNoteComplaint.reviewChain || [])];
    if (nextStatus === "Pending Level 1 Review" && updatedReviewChain.length === 0) {
      updatedReviewChain.push({
        levelName: "Level 1 — HR Manager Review",
        reviewer: "Neha Mehta",
        status: "Pending",
      });
    }

    const timelineEntry: GrievanceTimelineEvent = {
      id: `TL-${Math.floor(10 + Math.random() * 90)}`,
      timestamp,
      user: "Neha Mehta",
      role: "HR Manager",
      action: `Saved Investigation Note & Updated Status to ${nextStatus}`,
      prevStatus: addingNoteComplaint.status,
      newStatus: nextStatus,
      comment: newNoteText.trim(),
    };

    const updatedNotes = [...(addingNoteComplaint.investigationNotes || []), newNote];
    const updatedTimeline = [timelineEntry, ...(addingNoteComplaint.timeline || [])];

    try {
      await hrComplaintService.update(addingNoteComplaint.id, {
        status: nextStatus,
        investigationNotes: updatedNotes,
        proposedResolution: proposedResolutionInput.trim() || addingNoteComplaint.proposedResolution,
        reviewChain: updatedReviewChain,
        timeline: updatedTimeline,
      });
      await loadComplaints();
      setAddingNoteComplaint(null);
      setNewNoteText("");
      setProposedResolutionInput("");
      setTargetNextStatus("Under Investigation");
      setToastMessage(`Saved investigation note & updated ticket #${addingNoteComplaint.ticketNo} status to ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save investigation note");
    }
  };

  // Review Decision Submit (Approve / Return / Escalate / Reject)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingComplaint || !reviewComment.trim()) return;

    const timestamp = new Date().toLocaleString("en-GB");
    let nextStatus: ComplaintWorkflowStatus = reviewingComplaint.status;

    if (reviewDecision === "Approve") {
      if (reviewingComplaint.status === "Pending Level 1 Review") {
        nextStatus = reviewingComplaint.reviewLevel === "Senior Management Review" ? "Pending Level 2 Review" : "Resolution Proposed";
      } else if (reviewingComplaint.status === "Pending Level 2 Review" || reviewingComplaint.status === "Resolution Proposed") {
        nextStatus = "Resolved";
      } else {
        nextStatus = "Resolved";
      }
    } else if (reviewDecision === "Return") {
      nextStatus = "Under Investigation";
    } else if (reviewDecision === "Escalate") {
      nextStatus = "Escalated";
    } else if (reviewDecision === "Reject") {
      nextStatus = "Rejected";
    }

    const timelineEntry: GrievanceTimelineEvent = {
      id: `TL-${Math.floor(10 + Math.random() * 90)}`,
      timestamp,
      user: "Neha Mehta",
      role: "HR Manager / Reviewer",
      action: `Review Decision: ${reviewDecision}`,
      prevStatus: reviewingComplaint.status,
      newStatus: nextStatus,
      comment: reviewComment.trim(),
    };

    // Update review chain state
    const updatedChain = (reviewingComplaint.reviewChain || []).map((step) => {
      if (step.status === "Pending") {
        return {
          ...step,
          status: reviewDecision === "Approve" ? ("Approved" as const) : reviewDecision === "Return" ? ("Returned" as const) : ("Rejected" as const),
          comment: reviewComment.trim(),
          timestamp,
        };
      }
      return step;
    });

    const updatedTimeline = [timelineEntry, ...(reviewingComplaint.timeline || [])];

    try {
      await hrComplaintService.update(reviewingComplaint.id, {
        status: nextStatus,
        reviewChain: updatedChain,
        timeline: updatedTimeline,
        resolutionNotes: nextStatus === "Resolved" ? (reviewComment.trim() || reviewingComplaint.resolutionNotes) : reviewingComplaint.resolutionNotes,
      });
      await loadComplaints();
      setReviewingComplaint(null);
      setReviewComment("");
      setToastMessage(`Updated ticket #${reviewingComplaint.ticketNo} status to ${nextStatus}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update review decision");
    }
  };

  const handleQuickResolve = async (c: ComplaintRecord) => {
    try {
      await hrComplaintService.update(c.id, { status: "Resolved" });
      await loadComplaints();
      setToastMessage(`Marked ticket #${c.ticketNo} as Resolved.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to resolve ticket");
    }
  };

  const handleQuickClose = async (c: ComplaintRecord) => {
    try {
      await hrComplaintService.update(c.id, { status: "Closed" });
      await loadComplaints();
      setToastMessage(`Closed grievance ticket #${c.ticketNo}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to close ticket");
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Grievances"
      title="Complaint List"
      description="Central grievance redressal dashboard for reviewing, investigating, approving multi-level escalations, and auditing employee complaints."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Grievances" },
        { label: "Complaint List" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: DASHBOARD KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
        <HRKPICard
          label="Total Complaints"
          value={`${stats.total}`}
          subtitle="All Logged Grievances"
          tone="blue"
          icon={<FileText className="h-5 w-5" />}
        />
        <HRKPICard
          label="Open / Initial Review"
          value={`${stats.openOrInitial}`}
          subtitle="Awaiting Initial Action"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Under Investigation"
          value={`${stats.underInvestigation}`}
          subtitle="Active Investigations"
          tone="purple"
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pending Review"
          value={`${stats.pendingReview}`}
          subtitle="Level 1 & 2 Reviews"
          tone="purple"
          icon={<Layers className="h-5 w-5" />}
        />
        <HRKPICard
          label="Resolved / Closed"
          value={`${stats.resolved}`}
          subtitle="Redressed &amp; Closed"
          tone="emerald"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Escalated / Critical"
          value={`${stats.escalatedOrCritical}`}
          subtitle="Immediate Action"
          tone="rose"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REUSABLE FILTER BAR TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Ticket, Complainant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Under Initial Review">Under Initial Review</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Pending Level 1 Review">Pending Level 1 Review</option>
                <option value="Pending Level 2 Review">Pending Level 2 Review</option>
                <option value="Resolution Proposed">Resolution Proposed</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Escalated">Escalated</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select
                value={selectedSlaStatus}
                onChange={(e) => setSelectedSlaStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All SLA Statuses</option>
                <option value="AT_RISK">⚠️ SLA At Risk</option>
                <option value="BREACHED">🔴 SLA Breached</option>
                <option value="NORMAL">🟢 On Time</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDept("ALL");
                  setSelectedCategory("ALL");
                  setSelectedStatus("ALL");
                  setSelectedPriority("ALL");
                  setSelectedOfficer("ALL");
                  setSelectedReviewLevel("ALL");
                  setSelectedSlaStatus("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
              </button>
            </div>
          </div>
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
                <th className="py-3.5 px-4">Ticket No</th>
                <th className="py-3.5 px-4">Complainant</th>
                <th className="py-3.5 px-4">Category &amp; Subject</th>
                <th className="py-3.5 px-4">Assigned Officer</th>
                <th className="py-3.5 px-4">SLA Tracker</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Contextual Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => {
                  const slaInfo = getSLAInfo(c);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => setViewingComplaint(c)}
                    >
                      <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">
                        {c.ticketNo}
                      </td>

                      <td className="py-3.5 px-4">
                        {c.isPoshOrConfidential ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-900 text-purple-200 flex items-center justify-center font-black text-xs">
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-extrabold text-purple-950">Confidential</p>
                              <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                Restricted Access
                              </span>
                            </div>
                          </div>
                        ) : c.isAnonymous ? (
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

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">{c.category}</p>
                        <p className="font-bold text-slate-900 truncate">
                          {c.isPoshOrConfidential ? "Confidential Grievance Subject" : c.subject}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {c.assignedOfficer ? (
                          <div>
                            <p className="font-bold text-slate-900">{c.assignedOfficer}</p>
                            <p className="text-[10px] text-slate-400">{c.assignedRole}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn("px-2.5 py-1 rounded-xl text-[11px] font-bold border", slaInfo.badgeClass)}>
                          {slaInfo.text}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                            c.priority === "Critical"
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : c.priority === "High"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : c.priority === "Medium"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {c.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* CONTEXTUAL PERMISSION-AWARE ACTIONS */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingComplaint(c)}
                            className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                          </Button>

                          {/* Open / Under Initial Review Actions */}
                          {(c.status === "Open" || c.status === "Under Initial Review") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAssigningComplaint(c)}
                              className="rounded-xl text-xs font-semibold text-blue-800 border-blue-300 hover:bg-blue-50"
                            >
                              <UserCheck className="h-3.5 w-3.5 mr-1 text-blue-600" /> Assign Officer
                            </Button>
                          )}

                          {/* Assigned / Under Investigation Actions */}
                          {(c.status === "Assigned" || c.status === "Under Investigation") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAddingNoteComplaint(c)}
                              className="rounded-xl text-xs font-semibold text-purple-800 border-purple-300 hover:bg-purple-50"
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1 text-purple-600" /> + Investigation Note
                            </Button>
                          )}

                          {/* Pending Review Actions */}
                          {c.status.startsWith("Pending") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewingComplaint(c);
                                setReviewDecision("Approve");
                                setReviewComment("");
                              }}
                              className="rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                            >
                              <Layers className="h-3.5 w-3.5 mr-1 text-amber-700" /> Review / Approve
                            </Button>
                          )}

                          {/* Resolution Proposed Actions */}
                          {c.status === "Resolution Proposed" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleQuickResolve(c)}
                              className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Resolve Ticket
                            </Button>
                          )}

                          {/* Resolved Actions */}
                          {c.status === "Resolved" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleQuickClose(c)}
                              className="rounded-xl text-xs font-semibold text-slate-800 border-slate-300 hover:bg-slate-100"
                            >
                              <Lock className="h-3.5 w-3.5 mr-1 text-slate-600" /> Close Ticket
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No complaints found matching your search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredComplaints.map((c) => {
          const slaInfo = getSLAInfo(c);

          return (
            <div
              key={c.id}
              onClick={() => setViewingComplaint(c)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-slate-900 text-xs">{c.ticketNo}</span>
                <StatusBadge status={c.status} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800">{c.category}</span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {c.isPoshOrConfidential ? "Confidential Grievance Subject" : c.subject}
                </h4>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="text-slate-600">Assigned: <strong>{c.assignedOfficer || "Unassigned"}</strong></p>
                <p className="text-slate-500">Submitted: {c.submittedDate}</p>
                <div className="pt-1">
                  <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold border", slaInfo.badgeClass)}>
                    {slaInfo.text}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewingComplaint(c)}
                  className="text-xs font-bold"
                >
                  View Details
                </Button>
                {c.status.startsWith("Pending") ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReviewingComplaint(c);
                      setReviewDecision("Approve");
                      setReviewComment("");
                    }}
                    className="text-xs font-bold text-amber-900 border-amber-300"
                  >
                    Review Decision
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAssigningComplaint(c)}
                    className="text-xs font-bold text-blue-800 border-blue-300"
                  >
                    Assign Officer
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ASSIGN OFFICER MODAL
      ───────────────────────────────────────────────────────────── */}
      {assigningComplaint && (
        <Modal
          isOpen={Boolean(assigningComplaint)}
          onClose={() => setAssigningComplaint(null)}
          title={`Assign Investigation Officer: #${assigningComplaint.ticketNo}`}
          description={`Select an officer based on required segregation of duties.`}
          size="md"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Officer / Lead <span className="text-rose-500">*</span></label>
              <select
                value={JSON.stringify(assignOfficerObj)}
                onChange={(e) => setAssignOfficerObj(JSON.parse(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              >
                {OFFICERS_LIST.map((officer, idx) => (
                  <option key={idx} value={JSON.stringify(officer)}>
                    {officer.name} ({officer.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assignment Instructions</label>
              <textarea
                rows={3}
                placeholder="Specific instructions for the investigating officer..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssigningComplaint(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white"
              >
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ADD INVESTIGATION NOTE MODAL
      ───────────────────────────────────────────────────────────── */}
      {addingNoteComplaint && (
        <Modal
          isOpen={Boolean(addingNoteComplaint)}
          onClose={() => setAddingNoteComplaint(null)}
          title={`Add Investigation Note: #${addingNoteComplaint.ticketNo}`}
          description="Log evidence, interview notes, and advance ticket to the next workflow stage."
          size="md"
        >
          <form onSubmit={handleAddInvestigationNote} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Investigation Note &amp; Findings <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Enter details of interviews conducted, evidence inspected..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {/* Advance Ticket Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Update Ticket Stage / Action After Note <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetNextStatus}
                onChange={(e) => setTargetNextStatus(e.target.value as any)}
                className="w-full rounded-xl border border-purple-200 p-2.5 font-bold text-purple-950 bg-purple-50/60 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <option value="Under Investigation">Stay in "Under Investigation" (In-progress)</option>
                <option value="Pending Level 1 Review">Submit for "Pending Level 1 Review" (HR Approval Needed)</option>
                <option value="Resolution Proposed">Set Status to "Resolution Proposed" (Ready for Resolution)</option>
              </select>
            </div>

            {/* Optional Proposed Resolution Statement */}
            {targetNextStatus !== "Under Investigation" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Proposed Resolution / Recommended Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Credit TSh 1,850 OT arrears in August payroll cycle..."
                  value={proposedResolutionInput}
                  onChange={(e) => setProposedResolutionInput(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 p-2.5 font-bold text-emerald-950 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddingNoteComplaint(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white"
              >
                Save Note &amp; Update Stage
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: REVIEW / APPROVE DECISION MODAL
      ───────────────────────────────────────────────────────────── */}
      {reviewingComplaint && (
        <Modal
          isOpen={Boolean(reviewingComplaint)}
          onClose={() => setReviewingComplaint(null)}
          title={`Review Decision: #${reviewingComplaint.ticketNo}`}
          description={`Submit formal review decision for ${reviewingComplaint.reviewLevel}.`}
          size="md"
        >
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Review Decision <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-4 gap-1.5 text-center font-bold">
                <button
                  type="button"
                  onClick={() => setReviewDecision("Approve")}
                  className={cn("py-2 rounded-xl border transition", reviewDecision === "Approve" ? "bg-emerald-700 text-white border-emerald-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("Return")}
                  className={cn("py-2 rounded-xl border transition", reviewDecision === "Return" ? "bg-amber-600 text-white border-amber-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}
                >
                  Return
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("Escalate")}
                  className={cn("py-2 rounded-xl border transition", reviewDecision === "Escalate" ? "bg-purple-700 text-white border-purple-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}
                >
                  Escalate
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision("Reject")}
                  className={cn("py-2 rounded-xl border transition", reviewDecision === "Reject" ? "bg-rose-700 text-white border-rose-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")}
                >
                  Reject
                </button>
              </div>
            </div>

            {reviewDecision === "Escalate" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Escalation Reviewer</label>
                <select
                  value={escalateToOfficer}
                  onChange={(e) => setEscalateToOfficer(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-purple-900 bg-purple-50"
                >
                  <option value="Vikram Malhotra (GM)">Vikram Malhotra (General Manager)</option>
                  <option value="POSH Internal Committee">POSH Internal Committee</option>
                  <option value="Executive Safety Board">Executive Safety Board</option>
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Review Decision Comments <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide detailed justification or instructions for this decision..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewingComplaint(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white"
              >
                Submit Decision
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: COMPLAINT DETAILS & WORKFLOW INVESTIGATION DRAWER
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingComplaint)}
        onClose={() => setViewingComplaint(null)}
        title="Complaint Details & Investigation Drawer"
        icon={<FileText className="h-5 w-5 text-emerald-700" />}
      >
        {viewingComplaint && (
          <div className="space-y-4 text-xs">
            {/* Header Summary */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono font-bold">{viewingComplaint.ticketNo}</span>
                <StatusBadge status={viewingComplaint.status} />
              </div>
              <h3 className="text-base font-black text-amber-400">
                {viewingComplaint.isPoshOrConfidential ? "Confidential Grievance Subject" : viewingComplaint.subject}
              </h3>
              <p className="text-xs text-slate-300">
                Category: <strong>{viewingComplaint.category}</strong> • Priority: <strong>{viewingComplaint.priority}</strong>
              </p>
            </div>

            {/* SECTION 1: COMPLAINT DESCRIPTION */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Complaint Description</span>
              <p className="text-slate-700 font-medium leading-relaxed">
                {viewingComplaint.isPoshOrConfidential
                  ? "Sensitive grievance details restricted under POSH / Confidentiality policy."
                  : viewingComplaint.description}
              </p>
              <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-1 mt-1">
                Incident Date: <strong>{viewingComplaint.incidentDate}</strong> • Submitted Date: <strong>{viewingComplaint.submittedDate}</strong>
              </p>
            </div>

            {/* SECTION 2: ASSIGNMENT INFO */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Assignment Details</span>
              {viewingComplaint.assignedOfficer ? (
                <div>
                  <p className="font-bold text-slate-900">Officer: {viewingComplaint.assignedOfficer} ({viewingComplaint.assignedRole})</p>
                  <p className="text-slate-500 text-[11px]">Assigned Date: {viewingComplaint.assignedDate} • By: {viewingComplaint.assignedBy}</p>
                </div>
              ) : (
                <p className="text-slate-400 italic">No officer assigned yet.</p>
              )}
            </div>

            {/* SECTION 3: INVESTIGATION NOTES & EVIDENCE */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <span className="font-extrabold text-purple-950 uppercase block text-[11px]">
                Investigation Notes &amp; Findings ({viewingComplaint.investigationNotes.length})
              </span>
              {viewingComplaint.investigationNotes.length > 0 ? (
                <div className="space-y-2">
                  {viewingComplaint.investigationNotes.map((note) => (
                    <div key={note.id} className="p-2.5 rounded-xl bg-white border border-purple-100 space-y-1">
                      <div className="flex justify-between font-bold text-purple-950">
                        <span>{note.author} ({note.authorRole})</span>
                        <span className="text-[10px] text-slate-400 font-mono">{note.timestamp}</span>
                      </div>
                      <p className="text-slate-700 font-medium">"{note.noteText}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No investigation notes added yet.</p>
              )}
            </div>

            {/* SECTION 4: MULTI-LEVEL REVIEW CHAIN */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <span className="font-extrabold text-amber-950 uppercase block text-[11px]">
                Multi-Level Review Requirement ({viewingComplaint.reviewLevel})
              </span>
              {viewingComplaint.reviewChain.length > 0 ? (
                <div className="space-y-1.5">
                  {viewingComplaint.reviewChain.map((step, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white border border-amber-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{step.levelName}</p>
                        <p className="text-[10px] text-slate-500">Reviewer: {step.reviewer}</p>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", step.status === "Approved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200")}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 font-medium">Standard 1-level approval workflow.</p>
              )}
            </div>

            {/* SECTION 5: PROPOSED RESOLUTION */}
            {viewingComplaint.proposedResolution && (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                <span className="font-extrabold text-emerald-950 uppercase block text-[11px]">Proposed Resolution</span>
                <p className="text-slate-800 font-bold">{viewingComplaint.proposedResolution}</p>
              </div>
            )}

            {/* SECTION 6: AUDIT TIMELINE */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Full Audit &amp; Activity Timeline</span>
              <div className="space-y-2 relative border-l-2 border-slate-300 ml-2 pl-3">
                {viewingComplaint.timeline.map((event) => (
                  <div key={event.id} className="relative space-y-0.5">
                    <div className="w-2 h-2 rounded-full bg-slate-700 absolute -left-[17px] top-1" />
                    <span className="text-[10px] text-slate-400 font-mono block">{event.timestamp}</span>
                    <p className="font-bold text-slate-900">{event.action}</p>
                    <p className="text-slate-600 font-medium">User: {event.user} ({event.role})</p>
                    {event.comment && <p className="text-slate-500 italic">"{event.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
