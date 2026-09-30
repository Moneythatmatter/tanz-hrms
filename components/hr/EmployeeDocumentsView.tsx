"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileCheck,
  CheckSquare,
  Building2,
  User,
  Calendar,
  ShieldAlert,
  Plus,
  Printer,
  X,
  File,
  Check,
  BellRing,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronUp,
  Send,
  RefreshCw,
  FolderOpen,
  Mail,
  Phone,
  List,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Modal } from "@/components/ui/Modal";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/utils";

// 8 Standardized Categories
export type CategorizedType =
  | "Identity Proof"
  | "Address Proof"
  | "Employment Documents"
  | "Educational Documents"
  | "Financial Documents"
  | "Statutory & Compliance"
  | "Medical & Verification"
  | "Other Documents";

export type StatusType = "Verified" | "Pending Verification" | "Expired" | "Missing" | "Uploaded" | "Expiring Soon";

export interface EmployeeDocRecord {
  id: string;
  docNumber?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  employmentType: "Permanent" | "Contractual" | "Probation" | "Trainee";
  docTitle: string;
  category: CategorizedType;
  fileFormat: "PDF" | "PNG" | "JPG" | "DOCX";
  fileSize: string;
  uploadedDate: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  status: StatusType;
  verifiedBy?: string;
  remarks?: string;
}

// Master Employee List for SearchSelect
export interface StaffMember {
  id: string;
  empCode: string;
  name: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  status: "Active" | "On Leave" | "Inactive";
  email?: string;
  phone?: string;
  joinDate?: string;
  tenureYears?: string;
}

export const MASTER_STAFF: StaffMember[] = [
  {
    id: "EMP-0101",
    empCode: "EMP-0101",
    name: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    status: "Active",
    email: "rajesh.kumar@hotel.com",
    phone: "+91 98765 43210",
    joinDate: "15/01/2022",
    tenureYears: "4.7 Y",
  },
  {
    id: "EMP-0102",
    empCode: "EMP-0102",
    name: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    status: "Active",
    email: "anjali.s@hotel.com",
    phone: "+91 98765 43211",
    joinDate: "01/06/2021",
    tenureYears: "5.2 Y",
  },
  {
    id: "EMP-0103",
    empCode: "EMP-0103",
    name: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    status: "Active",
    email: "chef.vikram@hotel.com",
    phone: "+91 98765 43212",
    joinDate: "12/03/2023",
    tenureYears: "3.4 Y",
  },
  {
    id: "EMP-0104",
    empCode: "EMP-0104",
    name: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    status: "Active",
    email: "priya.patel@hotel.com",
    phone: "+91 98765 43213",
    joinDate: "10/06/2024",
    tenureYears: "2.1 Y",
  },
  {
    id: "EMP-0105",
    empCode: "EMP-0105",
    name: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    status: "Active",
    email: "arjun.v@hotel.com",
    phone: "+91 98765 43214",
    joinDate: "02/05/2025",
    tenureYears: "1.3 Y",
  },
  {
    id: "EMP-0106",
    empCode: "EMP-0106",
    name: "Meera Nair",
    department: "Front Office",
    designation: "Concierge Lead",
    avatar: "MN",
    status: "Active",
    email: "meera.nair@hotel.com",
    phone: "+91 98765 43215",
    joinDate: "14/02/2025",
    tenureYears: "1.5 Y",
  },
  {
    id: "EMP-0107",
    empCode: "EMP-0107",
    name: "Sanjay Dutt",
    department: "Accounts",
    designation: "Senior Accountant",
    avatar: "SD",
    status: "Active",
    email: "sanjay.dutt@hotel.com",
    phone: "+91 98765 43216",
    joinDate: "01/08/2024",
    tenureYears: "2.0 Y",
  },
  {
    id: "EMP-0108",
    empCode: "EMP-0108",
    name: "Kavita Reddy",
    department: "Housekeeping",
    designation: "Room Attendant",
    avatar: "KR",
    status: "Active",
    email: "kavita.r@hotel.com",
    phone: "+91 98765 43217",
    joinDate: "04/08/2026",
    tenureYears: "0.1 Y",
  },
];

const INITIAL_RECORDS: EmployeeDocRecord[] = [
  // Rajesh Kumar Docs
  {
    id: "D-101",
    docNumber: "XXXX-XXXX-4821",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Aadhaar Card",
    category: "Identity Proof",
    fileFormat: "PDF",
    fileSize: "2.4 MB",
    uploadedDate: "15/01/2022",
    status: "Verified",
    verifiedBy: "Neha Mehta (HR)",
    remarks: "UIDAI biometric status verified.",
  },
  {
    id: "D-102",
    docNumber: "ABCDE1234F",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "PAN Card",
    category: "Identity Proof",
    fileFormat: "PNG",
    fileSize: "850 KB",
    uploadedDate: "15/01/2022",
    status: "Verified",
    verifiedBy: "Neha Mehta (HR)",
  },
  {
    id: "D-103",
    docNumber: "Z9482710",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Passport",
    category: "Identity Proof",
    fileFormat: "PDF",
    fileSize: "3.1 MB",
    uploadedDate: "15/01/2022",
    expiryDate: "20/08/2026",
    daysUntilExpiry: 13,
    status: "Expiring Soon",
    verifiedBy: "Neha Mehta (HR)",
    remarks: "Passport renewal required within 30 days.",
  },
  {
    id: "D-104",
    docNumber: "DL-KA01-2020",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Driving Licence",
    category: "Identity Proof",
    fileFormat: "PDF",
    fileSize: "1.2 MB",
    uploadedDate: "-",
    status: "Missing",
    remarks: "Document pending upload.",
  },
  {
    id: "D-105",
    docNumber: "ADDR-ADD-4821",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Aadhaar (Address Copy)",
    category: "Address Proof",
    fileFormat: "PDF",
    fileSize: "1.9 MB",
    uploadedDate: "15/01/2022",
    status: "Verified",
    verifiedBy: "Neha Mehta (HR)",
  },
  {
    id: "D-106",
    docNumber: "CV-2022-RK",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Resume",
    category: "Employment Documents",
    fileFormat: "PDF",
    fileSize: "920 KB",
    uploadedDate: "10/01/2022",
    status: "Verified",
    verifiedBy: "HR Recruiter",
  },
  {
    id: "D-107",
    docNumber: "OFF-2022-01",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Offer Letter",
    category: "Employment Documents",
    fileFormat: "PDF",
    fileSize: "1.1 MB",
    uploadedDate: "12/01/2022",
    status: "Verified",
    verifiedBy: "HR Admin",
  },
  {
    id: "D-108",
    docNumber: "APP-2022-01",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Appointment Letter",
    category: "Employment Documents",
    fileFormat: "PDF",
    fileSize: "1.5 MB",
    uploadedDate: "15/01/2022",
    status: "Verified",
    verifiedBy: "HR Director",
  },
  {
    id: "D-109",
    docNumber: "DEG-BHM-2015",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Degree Certificate (BHM)",
    category: "Educational Documents",
    fileFormat: "PDF",
    fileSize: "3.5 MB",
    uploadedDate: "15/01/2022",
    status: "Verified",
    verifiedBy: "Neha Mehta (HR)",
  },
  {
    id: "D-110",
    docNumber: "BANK-CHK-9876",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Bank Passbook / Cancelled Cheque",
    category: "Financial Documents",
    fileFormat: "PDF",
    fileSize: "1.3 MB",
    uploadedDate: "18/01/2022",
    status: "Verified",
    verifiedBy: "Finance Mgr",
  },
  {
    id: "D-111",
    docNumber: "UAN-1012938475",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "UAN (EPF)",
    category: "Financial Documents",
    fileFormat: "PDF",
    fileSize: "640 KB",
    uploadedDate: "20/01/2022",
    status: "Verified",
    verifiedBy: "Payroll Lead",
  },
  {
    id: "D-112",
    docNumber: "NDA-2022-FO",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Confidentiality / NDA Agreement",
    category: "Statutory & Compliance",
    fileFormat: "PDF",
    fileSize: "800 KB",
    uploadedDate: "20/01/2022",
    status: "Verified",
    verifiedBy: "Legal Officer",
  },
  {
    id: "D-113",
    docNumber: "MED-FIT-2024",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Medical Fitness Certificate",
    category: "Medical & Verification",
    fileFormat: "PDF",
    fileSize: "1.5 MB",
    uploadedDate: "10/06/2024",
    expiryDate: "10/06/2025",
    daysUntilExpiry: -423,
    status: "Expired",
    verifiedBy: "Health Lead",
    remarks: "Medical clearance expired. Renewal required.",
  },
  {
    id: "D-114",
    docNumber: "POL-VRF-2024",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Police Verification Certificate",
    category: "Medical & Verification",
    fileFormat: "PDF",
    fileSize: "1.8 MB",
    uploadedDate: "20/01/2022",
    expiryDate: "15/08/2026",
    daysUntilExpiry: 8,
    status: "Expiring Soon",
    verifiedBy: "Security Lead",
  },
  {
    id: "D-115",
    docNumber: "PHOTO-RK-2022",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    employmentType: "Permanent",
    docTitle: "Passport-size Photograph",
    category: "Other Documents",
    fileFormat: "JPG",
    fileSize: "450 KB",
    uploadedDate: "15/01/2022",
    status: "Verified",
    verifiedBy: "HR Admin",
  },
];

const CATEGORY_DEFINITIONS: {
  category: CategorizedType;
}[] = [
  { category: "Identity Proof" },
  { category: "Address Proof" },
  { category: "Employment Documents" },
  { category: "Educational Documents" },
  { category: "Financial Documents" },
  { category: "Statutory & Compliance" },
  { category: "Medical & Verification" },
  { category: "Other Documents" },
];

export function EmployeeDocumentsView() {
  const [records, setRecords] = useState<EmployeeDocRecord[]>(INITIAL_RECORDS);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("EMP-0101"); // Default to Rajesh Kumar
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedExpiry, setSelectedExpiry] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"categorized" | "table">("categorized");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // SearchSelect Autocomplete query & state
  const [empSearchQuery, setEmpSearchQuery] = useState("");
  const [isEmpSearchOpen, setIsEmpSearchOpen] = useState(false);
  const empSearchRef = useRef<HTMLDivElement>(null);

  // Category Expand/Collapse Accordion state
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Identity Proof": true,
    "Address Proof": true,
    "Employment Documents": true,
    "Educational Documents": true,
    "Financial Documents": true,
    "Statutory & Compliance": true,
    "Medical & Verification": true,
    "Other Documents": true,
  });

  // Drawer Panel & Modal States
  const [activeDrawerDoc, setActiveDrawerDoc] = useState<EmployeeDocRecord | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [targetCategoryForUpload, setTargetCategoryForUpload] = useState<CategorizedType>("Identity Proof");
  const [replaceDocTarget, setReplaceDocTarget] = useState<EmployeeDocRecord | null>(null);

  // Upload Form
  const [uploadDocTitle, setUploadDocTitle] = useState("");
  const [uploadDocNumber, setUploadDocNumber] = useState("");
  const [uploadExpiryDate, setUploadExpiryDate] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  // Active Employee object
  const activeEmployee = useMemo(() => {
    if (selectedEmpId === "ALL") return null;
    return MASTER_STAFF.find((s) => s.id === selectedEmpId) || MASTER_STAFF[0];
  }, [selectedEmpId]);

  // Autocomplete matching employee list
  const matchingStaffOptions = useMemo(() => {
    const q = empSearchQuery.toLowerCase().trim();
    if (!q) return MASTER_STAFF;
    return MASTER_STAFF.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.empCode.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
    );
  }, [empSearchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (empSearchRef.current && !empSearchRef.current.contains(event.target as Node)) {
        setIsEmpSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered documents
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchEmp = selectedEmpId === "ALL" || rec.employeeId === selectedEmpId;
      const matchSearch =
        rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.docTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDepartment === "ALL" || rec.department === selectedDepartment;
      const matchCat = selectedCategory === "ALL" || rec.category === selectedCategory;
      const matchStatus = selectedStatus === "ALL" || rec.status === selectedStatus;

      let matchExpiry = true;
      if (selectedExpiry === "EXPIRED") matchExpiry = rec.status === "Expired";
      else if (selectedExpiry === "EXPIRING_SOON") matchExpiry = rec.status === "Expiring Soon";
      else if (selectedExpiry === "VALID") matchExpiry = rec.status === "Verified" || rec.status === "Uploaded";

      return matchEmp && matchSearch && matchDept && matchCat && matchStatus && matchExpiry;
    });
  }, [records, selectedEmpId, searchTerm, selectedDepartment, selectedCategory, selectedStatus, selectedExpiry]);

  // Employee Specific Summary Metrics
  const empSummary = useMemo(() => {
    const empDocs = filteredRecords;
    const total = empDocs.length;
    const verified = empDocs.filter((d) => d.status === "Verified").length;
    const expired = empDocs.filter((d) => d.status === "Expired").length;
    const missing = empDocs.filter((d) => d.status === "Missing").length;
    const pending = empDocs.filter((d) => d.status === "Pending Verification").length;
    return { total, verified, expired, missing, pending };
  }, [filteredRecords]);

  const toggleCategory = (catName: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const renderStatusBadge = (status: StatusType, daysUntilExpiry?: number) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Verified
          </span>
        );
      case "Pending Verification":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
            Pending
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            Expired
          </span>
        );
      case "Missing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
            Missing
          </span>
        );
      case "Uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
            Uploaded
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            Expiring Soon ({daysUntilExpiry ?? 13}d)
          </span>
        );
    }
  };

  const handleVerify = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Verified", verifiedBy: "HR Admin (Neha Mehta)" } : r))
    );
    if (activeDrawerDoc?.id === id) {
      setActiveDrawerDoc((prev) => (prev ? { ...prev, status: "Verified", verifiedBy: "HR Admin (Neha Mehta)" } : null));
    }
    setToastMessage("Document verified successfully.");
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (activeDrawerDoc?.id === id) setActiveDrawerDoc(null);
    setToastMessage("Document deleted from repository.");
  };

  const handleOpenUploadForCategory = (cat: CategorizedType) => {
    setTargetCategoryForUpload(cat);
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocTitle) return;

    const emp = activeEmployee || MASTER_STAFF[0];

    const newRec: EmployeeDocRecord = {
      id: `D-${Math.floor(100 + Math.random() * 900)}`,
      docNumber: uploadDocNumber || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      designation: emp.designation,
      employmentType: "Permanent",
      docTitle: uploadDocTitle,
      category: targetCategoryForUpload,
      fileFormat: uploadFileName?.endsWith(".png") ? "PNG" : "PDF",
      fileSize: "1.8 MB",
      uploadedDate: new Date().toLocaleDateString("en-GB"),
      expiryDate: uploadExpiryDate || undefined,
      status: "Uploaded",
      remarks: uploadNotes || "Uploaded by HR Admin.",
    };

    setRecords((prev) => [newRec, ...prev]);
    setIsUploadModalOpen(false);
    setToastMessage(`Uploaded "${uploadDocTitle}" into ${targetCategoryForUpload}.`);

    // Reset Form
    setUploadDocTitle("");
    setUploadDocNumber("");
    setUploadExpiryDate("");
    setUploadNotes("");
    setUploadFileName(null);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource Management"
      title="Employee Documents"
      description="Central HR document management screen. Search for an employee and manage all documents grouped by structured categories, verify credentials, and track expiry."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Employee Documents" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenUploadForCategory("Identity Proof")}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Upload Document
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting document audit report...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Log
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: SEARCH & SELECT EMPLOYEE (SearchSelect & Context Card)
      ───────────────────────────────────────────────────────────── */}
      <div className="mb-5 space-y-3">
        {/* SearchSelect Bar */}
        <div className="relative w-full" ref={empSearchRef}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={empSearchQuery}
              onFocus={() => setIsEmpSearchOpen(true)}
              onChange={(e) => {
                setEmpSearchQuery(e.target.value);
                setIsEmpSearchOpen(true);
              }}
              placeholder="🔍 Search employee by Name, Employee ID or Department..."
              className="h-11 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-10 text-xs font-bold text-slate-900 shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition"
            />
            {empSearchQuery && (
              <button
                type="button"
                onClick={() => setEmpSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isEmpSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1 max-h-72 overflow-y-auto animate-in fade-in-50">
              <div
                onClick={() => {
                  setSelectedEmpId("ALL");
                  setIsEmpSearchOpen(false);
                  setEmpSearchQuery("");
                }}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition hover:bg-slate-100/80 border border-transparent",
                  selectedEmpId === "ALL" && "bg-emerald-50 text-emerald-900 border-emerald-200"
                )}
              >
                <span className="font-bold text-xs text-slate-900">🌐 All Employees (106 Staff Repository)</span>
                {selectedEmpId === "ALL" && <Check className="h-4 w-4 text-emerald-600" />}
              </div>

              <div className="border-t border-slate-100 my-1" />

              {matchingStaffOptions.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => {
                    setSelectedEmpId(staff.id);
                    setIsEmpSearchOpen(false);
                    setEmpSearchQuery("");
                  }}
                  className={cn(
                    "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition hover:bg-slate-100/80 border border-transparent",
                    selectedEmpId === staff.id && "bg-emerald-50 text-emerald-900 border-emerald-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {staff.photoUrl ? (
                      <img src={staff.photoUrl} alt={staff.name} className="h-8 w-8 rounded-xl object-cover border border-slate-200 shrink-0" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-2xs">
                        {staff.avatar}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{staff.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{staff.empCode}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {staff.designation} • <span className="text-emerald-700 font-semibold">{staff.department}</span>
                      </p>
                    </div>
                  </div>
                  {selectedEmpId === staff.id && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Precise Contextual Employee Summary Card */}
        {activeEmployee && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {activeEmployee.photoUrl ? (
                  <img
                    src={activeEmployee.photoUrl}
                    alt={activeEmployee.name}
                    className="h-12 w-12 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-base shrink-0 shadow-2xs">
                    {activeEmployee.avatar}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-slate-900">{activeEmployee.name}</h2>
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                      {activeEmployee.empCode}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      {activeEmployee.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {activeEmployee.designation} • <span className="text-emerald-700 font-bold">{activeEmployee.department}</span>
                  </p>
                </div>
              </div>

              <div className="text-right sm:text-right shrink-0">
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                  {activeEmployee.tenureYears || "4.7 Y"} Tenure
                </span>
              </div>
            </div>

            {/* Email & Phone */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
              {activeEmployee.email && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  {activeEmployee.email}
                </span>
              )}
              {activeEmployee.phone && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {activeEmployee.phone}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: 4 KPI SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Documents</p>
            <h4 className="text-2xl font-black text-slate-900 mt-1">{empSummary.total}</h4>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">{empSummary.verified} Verified</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Verification</p>
            <h4 className="text-2xl font-black text-amber-900 mt-1">{empSummary.pending}</h4>
            <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Requires Approval</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expired Documents</p>
            <h4 className="text-2xl font-black text-rose-900 mt-1">{empSummary.expired}</h4>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Renewal Due</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Missing Documents</p>
            <h4 className="text-2xl font-black text-slate-800 mt-1">{empSummary.missing}</h4>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Pending Submission</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-300">
            <FolderOpen className="h-5 w-5" />
          </div>
        </div>
      </div>
      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CLEAN STANDARDIZED MODULE TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-5 flex items-center justify-between gap-3">
        {/* Full-width Rounded Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-xs rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white font-medium text-slate-800 shadow-2xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Right-aligned Filter Dropdowns & View Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-full border border-slate-200 py-2 px-3 bg-white font-bold text-slate-700 shadow-2xs"
          >
            <option value="ALL">All Categories</option>
            {CATEGORY_DEFINITIONS.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs rounded-full border border-slate-200 py-2 px-3 bg-white font-bold text-slate-700 shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Expired">Expired</option>
            <option value="Missing">Missing</option>
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-slate-200 rounded-full p-0.5 bg-slate-50 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("categorized")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5",
                viewMode === "categorized"
                  ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Categorized View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-full transition flex items-center gap-1.5",
                viewMode === "table"
                  ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Flat Table View</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: CATEGORIZED COLLAPSIBLE CARDS VIEW
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "categorized" ? (
        <div className="space-y-4">
          {CATEGORY_DEFINITIONS.map((def) => {
            const isExpanded = expandedCategories[def.category] ?? true;
            const docsInCat = filteredRecords.filter((r) => r.category === def.category);
            const uploadedCount = docsInCat.filter((d) => d.status !== "Missing").length;

            return (
              <div
                key={def.category}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Clean Simple Category Header with Always Visible + Upload Button */}
                <div
                  onClick={() => toggleCategory(def.category)}
                  className="flex items-center justify-between p-4 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer border-b border-slate-200 transition"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-emerald-700" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{def.category}</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {uploadedCount} Documents Uploaded
                      </p>
                    </div>
                  </div>

                  {/* Always Visible Explicit Upload Button & Chevron */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenUploadForCategory(def.category);
                      }}
                      className="inline-flex items-center gap-1.5 bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 text-xs font-bold rounded-xl px-3 py-1.5 shadow-2xs transition shrink-0 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Upload</span>
                    </button>

                    <button type="button" className="p-1 text-slate-400">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Category Body */}
                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {docsInCat.length === 0 ? (
                      /* Clean Empty Category State */
                      <div className="p-6 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">No documents uploaded.</p>
                        <button
                          type="button"
                          onClick={() => handleOpenUploadForCategory(def.category)}
                          className="mt-3 inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold px-3 py-1.5 shadow-xs transition"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Upload Document</span>
                        </button>
                      </div>
                    ) : (
                      /* Streamlined Document Table: 2 Icons Only (Download, Delete) */
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Document Name</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 hidden sm:table-cell">Uploaded Date</th>
                              <th className="py-2.5 px-3 hidden md:table-cell">Expiry</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {docsInCat.map((doc) => (
                              <tr
                                key={doc.id}
                                className="hover:bg-slate-50/80 transition cursor-pointer"
                                onClick={() => setActiveDrawerDoc(doc)}
                              >
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <FileText className="h-4 w-4 text-emerald-700 shrink-0" />
                                    <div>
                                      <p className="font-bold text-slate-900">{doc.docTitle}</p>
                                      {doc.docNumber && (
                                        <p className="text-[10px] text-slate-400 font-mono">{doc.docNumber}</p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-3">
                                  {renderStatusBadge(doc.status, doc.daysUntilExpiry)}
                                </td>

                                <td className="py-3 px-3 hidden sm:table-cell text-slate-600 font-medium">
                                  {doc.uploadedDate}
                                </td>

                                <td className="py-3 px-3 hidden md:table-cell font-medium">
                                  {doc.expiryDate || "No Expiry"}
                                </td>

                                {/* Streamlined Actions: Download & Delete */}
                                <td
                                  className="py-3 px-3 text-right"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setToastMessage(`Downloading ${doc.docTitle}...`)}
                                      title="Download File"
                                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => handleDelete(doc.id, e)}
                                      title="Delete Document"
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
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
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Table View Fallback */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/90 transition cursor-pointer" onClick={() => setActiveDrawerDoc(doc)}>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{doc.employeeName} ({doc.employeeId})</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{doc.docTitle}</td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.category}</td>
                    <td className="py-3.5 px-4">{renderStatusBadge(doc.status, doc.daysUntilExpiry)}</td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setToastMessage(`Downloading ${doc.docTitle}...`)} title="Download File" className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer">
                          <Download className="h-4 w-4" />
                        </button>
                        <button onClick={(e) => handleDelete(doc.id, e)} title="Delete Document" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer">
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: DOCUMENT DETAILS, PREVIEW, REPLACE & VERIFY
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(activeDrawerDoc)}
        onClose={() => setActiveDrawerDoc(null)}
        title="Document Verification Panel"
        icon={<FileText className="h-5 w-5 text-emerald-700" />}
        footer={
          activeDrawerDoc ? (
            <div className="flex w-full items-center gap-2">
              {activeDrawerDoc.status !== "Verified" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleVerify(activeDrawerDoc.id)}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold h-9"
                >
                  <Check className="mr-1 h-4 w-4" /> Approve &amp; Verify
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplaceDocTarget(activeDrawerDoc);
                  setIsReplaceModalOpen(true);
                }}
                className="flex-1 text-slate-700 bg-white border-slate-300 rounded-xl text-xs font-bold h-9"
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Replace Document
              </Button>
            </div>
          ) : undefined
        }
      >
        {activeDrawerDoc && (
          <>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900">{activeDrawerDoc.employeeName}</h4>
                <span className="font-mono text-xs text-slate-600 font-bold">{activeDrawerDoc.employeeId}</span>
              </div>
              <p className="text-xs text-slate-500">
                {activeDrawerDoc.designation} •{" "}
                <span className="text-emerald-700 font-semibold">{activeDrawerDoc.department}</span>
              </p>
            </div>

            <div className="space-y-2 border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Document Title</span>
                {renderStatusBadge(activeDrawerDoc.status, activeDrawerDoc.daysUntilExpiry)}
              </div>
              <h3 className="font-bold text-base text-slate-900">{activeDrawerDoc.docTitle}</h3>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Uploaded Date</span>
                  <span className="font-semibold text-slate-800">{activeDrawerDoc.uploadedDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Verified By</span>
                  <span className="font-semibold text-slate-800">{activeDrawerDoc.verifiedBy || "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center text-white space-y-2">
              <FileText className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-xs font-semibold">{activeDrawerDoc.docTitle}</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Format: {activeDrawerDoc.fileFormat} • Size: {activeDrawerDoc.fileSize}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() => setToastMessage(`Downloading ${activeDrawerDoc.docTitle}...`)}
                className="mt-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold h-7"
              >
                <Download className="mr-1 h-3 w-3" /> Download File
              </Button>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700">HR Verification Remarks</label>
              <textarea
                rows={2}
                value={activeDrawerDoc.remarks || ""}
                onChange={(e) =>
                  setActiveDrawerDoc((prev) => (prev ? { ...prev, remarks: e.target.value } : null))
                }
                placeholder="Add verification notes..."
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </>
        )}
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: SINGLE UPLOAD MODAL
      ───────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Upload Document into ${targetCategoryForUpload}`}
        description="Upload a verified employee document or credential."
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
            <select
              value={targetCategoryForUpload}
              onChange={(e) => setTargetCategoryForUpload(e.target.value as CategorizedType)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
            >
              {CATEGORY_DEFINITIONS.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Document Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Passport Copy or Police Verification"
              value={uploadDocTitle}
              onChange={(e) => setUploadDocTitle(e.target.value)}
              required
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Attachment File</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50/50">
              <label className="cursor-pointer flex flex-col items-center">
                <Upload className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-emerald-700">Click to upload file</span>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setUploadFileName(e.target.files[0].name);
                  }}
                  className="hidden"
                />
              </label>
              {uploadFileName && (
                <p className="mt-2 text-xs font-semibold text-emerald-800">Attached: {uploadFileName}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Upload &amp; Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: REPLACE FILE MODAL
      ───────────────────────────────────────────────────────────── */}
      {replaceDocTarget && (
        <Modal
          isOpen={isReplaceModalOpen}
          onClose={() => setIsReplaceModalOpen(false)}
          title={`Replace "${replaceDocTarget.docTitle}"`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Select replacement document for {replaceDocTarget.employeeName} ({replaceDocTarget.employeeId}).
            </p>
            <div className="border-2 border-dashed border-emerald-300 rounded-xl p-6 text-center bg-emerald-50/50">
              <RefreshCw className="h-8 w-8 text-emerald-700 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-800">Select Replacement File</span>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsReplaceModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setRecords((prev) =>
                    prev.map((r) =>
                      r.id === replaceDocTarget.id
                        ? { ...r, status: "Pending Verification", uploadedDate: new Date().toLocaleDateString("en-GB") }
                        : r
                    )
                  );
                  setIsReplaceModalOpen(false);
                  setToastMessage(`Replaced file for "${replaceDocTarget.docTitle}".`);
                }}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Confirm Replacement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
