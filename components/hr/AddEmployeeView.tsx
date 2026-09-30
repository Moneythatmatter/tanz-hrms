"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import React, { useMemo, useState, useEffect, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  AddEmployeePreviewModal,
  type EmployeeFormPreviewData,
} from "@/components/hr/AddEmployeePreviewModal";
import type { SalaryStructure } from "@/components/hr/SalaryStructureView";
import { cn } from "@/lib/utils";
import { getLeavePolicySelectOptions } from "@/components/hr/LeavePolicyMasterView";
import {
  hrDepartmentService,
  hrDesignationService,
  hrEmploymentTypeService,
  hrEmployeeService,
  hrLeavePolicyService,
  hrSalaryStructureService,
  hrShiftTypeService,
  hrDocumentTypeService,
} from "@/services/human-resources";
import {
  buildNameIdMap,
  mapDepartmentFromApi,
  mapDesignationFromApi,
  mapEmploymentTypeFromApi,
  mapLeavePolicyFromApi,
  mapSalaryStructureFromApi,
  mapShiftTypeFromApi,
  mapDocumentTypeFromApi,
  mapEmployeeToApi,
} from "@/lib/hr/api-mappers";

const inputClass = "rounded-xl h-10 text-sm";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Probation", label: "Probation" },
  { value: "Notice Period", label: "Notice Period" },
  { value: "Inactive", label: "Inactive" },
];

const shiftTypeOptions = [
  { value: "Morning Shift", label: "Morning Shift" },
  { value: "Evening Shift", label: "Evening Shift" },
  { value: "Night Shift", label: "Night Shift" },
  { value: "General Shift", label: "General Shift" },
];

const weeklyOffOptions = [
  { value: "Sunday Only", label: "Sunday Only" },
  { value: "Rotational Off", label: "Rotational Off" },
  { value: "Alternate Saturdays & Sundays", label: "Alternate Saturdays & Sundays" },
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const emergencyRelationOptions = [
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Sibling", label: "Sibling" },
  { value: "Friend", label: "Friend" },
];

interface UploadedDocument {
  id: string;
  type: string;
  fileName: string;
  uploadDate: string;
  size: string;
}

function FormSection({
  icon,
  iconClassName,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconClassName)}>
            {icon}
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
            <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
          </div>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function ActionButtons({
  isSubmitting,
  onCancel,
  onReviewSave,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onReviewSave: (addAnother: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCancel}
        className="rounded-xl bg-white text-xs font-semibold shadow-xs"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Cancel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onReviewSave(true)}
        disabled={isSubmitting}
        className="rounded-xl border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 shadow-xs hover:bg-emerald-100"
      >
        Save &amp; Add Another
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => onReviewSave(false)}
        disabled={isSubmitting}
        className="rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
      >
        <Save className="mr-1.5 h-3.5 w-3.5" />
        {isSubmitting ? "Saving..." : "Save Employee"}
      </Button>
    </div>
  );
}

export function AddEmployeeView() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saveAfterPreview, setSaveAfterPreview] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
  const [designationOptions, setDesignationOptions] = useState<{ value: string; label: string }[]>([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [shiftTypeOptionsLoaded, setShiftTypeOptionsLoaded] = useState<{ value: string; label: string }[]>([]);
  const [leavePolicyOptions, setLeavePolicyOptions] = useState<{ value: string; label: string }[]>([]);
  const [salaryStructureOptions, setSalaryStructureOptions] = useState<{ value: string; label: string }[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);
  const [documentTypeOptions, setDocumentTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [masterLookups, setMasterLookups] = useState<{
    departmentNameToId: Map<string, string>;
    designationNameToId: Map<string, string>;
    employmentTypeNameToId: Map<string, string>;
    shiftTypeNameToId: Map<string, string>;
    leavePolicyNameToId: Map<string, string>;
  }>({
    departmentNameToId: new Map(),
    designationNameToId: new Map(),
    employmentTypeNameToId: new Map(),
    shiftTypeNameToId: new Map(),
    leavePolicyNameToId: new Map(),
  });

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [deptRows, desigRows, empTypeRows, shiftRows, policyRows, structureRows, docTypeRows] =
          await Promise.all([
            hrDepartmentService.list(),
            hrDesignationService.list(),
            hrEmploymentTypeService.list(),
            hrShiftTypeService.list(),
            hrLeavePolicyService.list(),
            hrSalaryStructureService.list(),
            hrDocumentTypeService.list(),
          ]);
        const departments = deptRows.map(mapDepartmentFromApi);
        const designations = desigRows.map((row) => mapDesignationFromApi(row));
        const employmentTypes = empTypeRows.map(mapEmploymentTypeFromApi);
        const shiftTypes = shiftRows.map(mapShiftTypeFromApi);
        const leavePolicies = policyRows.map(mapLeavePolicyFromApi);
        const structures = structureRows.map(mapSalaryStructureFromApi);
        const docTypes = docTypeRows.map((row) => mapDocumentTypeFromApi(row));

        setDepartmentOptions(departments.map((d) => ({ value: d.departmentName, label: d.departmentName })));
        setDesignationOptions(designations.map((d) => ({ value: d.designationTitle, label: d.designationTitle })));
        setEmploymentTypeOptions(employmentTypes.map((t) => ({ value: t.typeName, label: t.typeName })));
        setShiftTypeOptionsLoaded(shiftTypes.map((s) => ({ value: s.shiftName, label: s.shiftName })));
        setLeavePolicyOptions(getLeavePolicySelectOptions(leavePolicies));
        setSalaryStructureOptions(structures.map((s) => ({ value: s.id, label: s.name })));
        setSalaryStructures(structures);
        setDocumentTypeOptions(docTypes.map((d) => ({ value: d.name, label: d.name })));
        setMasterLookups({
          departmentNameToId: buildNameIdMap(deptRows, "departmentName"),
          designationNameToId: buildNameIdMap(desigRows, "designationTitle"),
          employmentTypeNameToId: buildNameIdMap(empTypeRows, "typeName"),
          shiftTypeNameToId: buildNameIdMap(shiftRows, "shiftName"),
          leavePolicyNameToId: buildNameIdMap(policyRows, "policyName"),
        });
      } catch (e) {
        setToastMessage(e instanceof Error ? e.message : "Failed to load master data");
      }
    };
    void loadMasters();
  }, []);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State initialized for fresh employee creation
  const [formData, setFormData] = useState({
    empCode: "EMP-0111",
    firstName: "",
    lastName: "",
    gender: "Male",
    dob: "",
    phone: "",
    personalEmail: "",
    photoUrl: "",

    // Section 2: Employment Info
    department: "",
    designation: "",
    reportingManager: "",
    employmentType: "",
    joinDate: new Date().toISOString().split("T")[0],
    workLocation: "",
    status: "Active",

    // Section 3: Attendance & Leave
    shiftType: "",
    weeklyOffPattern: "",
    leavePolicy: "",

    // Section 4: Payroll Information
    salaryStructure: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
    uanNumber: "",
    esicNumber: "",

    // Section 5: Emergency Contact
    emergencyName: "",
    emergencyRelation: "Spouse",
    emergencyPhone: "",

    // Section 7: PMS System Access
    enableSystemAccess: false,
    username: "",
    password: "",
    confirmPassword: "",
    userRole: "",
  });

  // Section 6: Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState("");

  const selectedSalaryStructure = useMemo(
    () => salaryStructures.find((s) => s.id === formData.salaryStructure),
    [salaryStructures, formData.salaryStructure],
  );

  const salaryBreakdown = useMemo(() => {
    if (!selectedSalaryStructure) {
      return { basic: 0, hra: 0, specialAllowance: 0, gross: 0, pfDeduction: 0, esicDeduction: 0, net: 0 };
    }
    const basic =
      selectedSalaryStructure.earnings.find((e) =>
        e.componentName.toLowerCase().includes("basic"),
      )?.computedAmount ?? 0;
    const hra =
      selectedSalaryStructure.earnings.find((e) =>
        e.componentName.toLowerCase().includes("hra"),
      )?.computedAmount ?? 0;
    const specialAllowance = Math.max(
      0,
      selectedSalaryStructure.grossSalary - basic - hra,
    );
    const pfDeduction =
      selectedSalaryStructure.deductions.find((d) =>
        d.componentName.toLowerCase().includes("pf"),
      )?.computedAmount ?? 0;
    const esicDeduction =
      selectedSalaryStructure.deductions.find((d) =>
        d.componentName.toLowerCase().includes("esi"),
      )?.computedAmount ?? 0;
    return {
      basic,
      hra,
      specialAllowance,
      gross: selectedSalaryStructure.grossSalary,
      pfDeduction,
      esicDeduction,
      net: selectedSalaryStructure.netSalary,
    };
  }, [selectedSalaryStructure]);

  // Form input handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const updateField = (name: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const previewData: EmployeeFormPreviewData = useMemo(
    () => ({
      ...formData,
      salaryStructureName: selectedSalaryStructure?.name,
      documents: documents.map((document) => ({
        type: document.type,
        fileName: document.fileName,
      })),
      salaryBreakdown,
    }),
    [formData, documents, salaryBreakdown, selectedSalaryStructure],
  );

  const validateForm = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setToastMessage("Please enter required first and last name.");
      return false;
    }
    if (!formData.phone.trim()) {
      setToastMessage("Please enter a valid mobile number.");
      return false;
    }
    if (!formData.department) {
      setToastMessage("Please select a department.");
      return false;
    }
    if (!formData.designation) {
      setToastMessage("Please select a designation.");
      return false;
    }
    if (!formData.employmentType) {
      setToastMessage("Please select an employment type.");
      return false;
    }
    if (!formData.salaryStructure) {
      setToastMessage("Please select a salary structure.");
      return false;
    }
    if (formData.enableSystemAccess && formData.password !== formData.confirmPassword) {
      setToastMessage("System access passwords do not match.");
      return false;
    }
    return true;
  };

  const handleReviewSave = (addAnother = false) => {
    if (!validateForm()) return;
    setSaveAfterPreview(addAnother);
    setShowPreview(true);
  };

  const resetFormForAnother = () => {
    setFormData({
      ...formData,
      empCode: `EMP-0${Math.floor(100 + Math.random() * 900)}`,
      firstName: "",
      lastName: "",
      phone: "",
      personalEmail: "",
      department: "",
      designation: "",
      employmentType: "",
      shiftType: "",
      weeklyOffPattern: "",
      leavePolicy: "",
      salaryStructure: "",
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      panNumber: "",
      uanNumber: "",
      esicNumber: "",
      emergencyName: "",
      emergencyPhone: "",
      enableSystemAccess: false,
      username: "",
      password: "",
      confirmPassword: "",
    });
    setDocuments([]);
  };

  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = mapEmployeeToApi(
        { ...formData, salaryStructureId: formData.salaryStructure },
        masterLookups,
      );
      await hrEmployeeService.create(payload);
      setIsSubmitting(false);
      setShowPreview(false);
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      setToastMessage(`Employee ${fullName} (${formData.empCode}) saved successfully.`);

      if (saveAfterPreview) {
        resetFormForAnother();
        return;
      }

      window.setTimeout(() => {
        router.push("/human-resources/employees/list");
      }, 800);
    } catch (e) {
      setIsSubmitting(false);
      setToastMessage(e instanceof Error ? e.message : "Failed to save employee");
    }
  };

  // Mock File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      type: selectedDocType,
      fileName: file.name,
      uploadDate: new Date().toLocaleDateString("en-GB"),
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    };

    setDocuments((prev) => [...prev, newDoc]);
    setToastMessage(`✓ ${selectedDocType} uploaded successfully.`);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Add Employee"
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Add Employee" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      wrapChildren={false}
      secondaryActions={
        <ActionButtons
          isSubmitting={isSubmitting}
          onCancel={() => router.push("/human-resources/employees/list")}
          onReviewSave={handleReviewSave}
        />
      }
    >
      <div className="space-y-5">
        <FormSection
          icon={<User className="h-4 w-4" />}
          iconClassName="bg-emerald-100 text-emerald-800"
          title="Section 1: Basic Information"
          subtitle="Personal identity and contact info"
          badge={
            <span className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
              ID: {formData.empCode}
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Employee ID (Auto Generated)">
              <TextInput value={formData.empCode} readOnly className={cn(inputClass, "bg-slate-50 font-semibold text-slate-600")} />
            </FormField>
            <FormField label="Gender" required>
              <DropdownSelect
                value={formData.gender}
                onChange={(value) => updateField("gender", value)}
                options={genderOptions}
                aria-label="Gender"
              />
            </FormField>
            <FormField label="First Name" required>
              <TextInput
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="e.g. Abhinav"
                className={inputClass}
              />
            </FormField>
            <FormField label="Last Name" required>
              <TextInput
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="e.g. Nayak"
                className={inputClass}
              />
            </FormField>
            <FormField label="Date of Birth" required>
              <TextInput
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={inputClass}
              />
            </FormField>
            <FormField label="Mobile Number" required>
              <TextInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </FormField>
            <FormField label="Personal Email">
              <TextInput
                type="email"
                name="personalEmail"
                value={formData.personalEmail}
                onChange={handleChange}
                placeholder="e.g. abhinav.nayak@gmail.com"
                className={inputClass}
              />
            </FormField>
            <FormField label="Profile Photo Upload">
              <input
                type="file"
                accept="image/*"
                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-emerald-800 hover:file:bg-emerald-100"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<Briefcase className="h-4 w-4" />}
          iconClassName="bg-blue-100 text-blue-800"
          title="Section 2: Employment Information"
          subtitle="Department, role, and tenure details (values from masters)"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Department" required>
              <DropdownSelect
                value={formData.department}
                onChange={(value) => updateField("department", value)}
                options={departmentOptions}
                placeholder="Select department"
                aria-label="Department"
              />
            </FormField>
            <FormField label="Designation" required>
              <DropdownSelect
                value={formData.designation}
                onChange={(value) => updateField("designation", value)}
                options={designationOptions}
                placeholder="Select designation"
                searchable
                aria-label="Designation"
              />
            </FormField>
            <FormField label="Reporting Manager">
              <TextInput
                name="reportingManager"
                value={formData.reportingManager}
                onChange={handleChange}
                placeholder="e.g. Vikram Malhotra (GM)"
                className={inputClass}
              />
            </FormField>
            <FormField label="Employment Type" required>
              <DropdownSelect
                value={formData.employmentType}
                onChange={(value) => updateField("employmentType", value)}
                options={employmentTypeOptions}
                placeholder="Select employment type"
                aria-label="Employment type"
              />
            </FormField>
            <FormField label="Joining Date" required>
              <TextInput
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleChange}
                className={inputClass}
              />
            </FormField>
            <FormField label="Work Location">
              <TextInput
                name="workLocation"
                value={formData.workLocation}
                onChange={handleChange}
                placeholder="e.g. Grand Hotel Main Property"
                className={inputClass}
              />
            </FormField>
            <FormField label="Employee Status">
              <DropdownSelect
                value={formData.status}
                onChange={(value) => updateField("status", value)}
                options={statusOptions}
                aria-label="Employee status"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<Clock className="h-4 w-4" />}
          iconClassName="bg-purple-100 text-purple-800"
          title="Section 3: Attendance & Leave Configuration"
          subtitle="Shift allocation and leave policy rules"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Shift Type" required>
              <DropdownSelect
                value={formData.shiftType}
                onChange={(value) => updateField("shiftType", value)}
                options={shiftTypeOptionsLoaded.length ? shiftTypeOptionsLoaded : shiftTypeOptions}
                placeholder="Select shift type"
                aria-label="Shift type"
              />
            </FormField>
            <FormField label="Weekly Off Pattern">
              <DropdownSelect
                value={formData.weeklyOffPattern}
                onChange={(value) => updateField("weeklyOffPattern", value)}
                options={weeklyOffOptions}
                placeholder="Select weekly off"
                aria-label="Weekly off pattern"
              />
            </FormField>
            <FormField label="Leave Policy" className="sm:col-span-2">
              <DropdownSelect
                value={formData.leavePolicy}
                onChange={(value) => updateField("leavePolicy", value)}
                options={leavePolicyOptions}
                placeholder="Select leave policy"
                aria-label="Leave policy"
              />
            </FormField>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-700" />
              <span className="font-bold text-purple-900">Assigned Shift Timing Preview</span>
            </div>
            <span className="rounded-lg border border-purple-200 bg-white px-3 py-1 font-semibold text-purple-950">
              {formData.shiftType || "No shift selected"}
            </span>
          </div>
        </FormSection>

        <FormSection
          icon={<CreditCard className="h-4 w-4" />}
          iconClassName="bg-amber-100 text-amber-800"
          title="Section 4: Payroll Information"
          subtitle="Salary structure, bank details, and statutory numbers"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Salary Structure" required>
              <DropdownSelect
                value={formData.salaryStructure}
                onChange={(value) => updateField("salaryStructure", value)}
                options={salaryStructureOptions}
                placeholder="Select salary structure"
                aria-label="Salary structure"
              />
            </FormField>
            <FormField label="Bank Name">
              <TextInput name="bankName" value={formData.bankName} onChange={handleChange} placeholder="HDFC Bank" className={inputClass} />
            </FormField>
            <FormField label="Account Holder Name">
              <TextInput name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} placeholder="Abhinav Nayak" className={inputClass} />
            </FormField>
            <FormField label="Account Number">
              <TextInput name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="5010023456789" className={inputClass} />
            </FormField>
            <FormField label="IFSC Code">
              <TextInput name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="HDFC0001234" className={inputClass} />
            </FormField>
            <FormField label="PAN Number">
              <TextInput name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" className={cn(inputClass, "uppercase")} />
            </FormField>
            <FormField label="UAN Number (PF)" helperText="Optional">
              <TextInput name="uanNumber" value={formData.uanNumber} onChange={handleChange} placeholder="e.g. 100987654321" className={inputClass} />
            </FormField>
            <FormField label="ESIC Number" helperText="Optional">
              <TextInput name="esicNumber" value={formData.esicNumber} onChange={handleChange} placeholder="e.g. 3100987654" className={inputClass} />
            </FormField>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="border-b border-amber-200/60 pb-2 text-xs font-bold uppercase tracking-wide text-amber-900">
              {selectedSalaryStructure
                ? `Breakdown — ${selectedSalaryStructure.name}`
                : "Select a salary structure to preview breakdown"}
            </p>
            {selectedSalaryStructure && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-[10px] text-slate-500">Basic Salary</p>
                <p className="font-bold text-slate-900">{formatMoney(salaryBreakdown.basic)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">HRA (40%)</p>
                <p className="font-bold text-slate-900">{formatMoney(salaryBreakdown.hra)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500">Special Allowance</p>
                <p className="font-bold text-slate-900">{formatMoney(salaryBreakdown.specialAllowance)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-amber-800">Gross Salary</p>
                <p className="text-sm font-extrabold text-amber-950">{formatMoney(salaryBreakdown.gross)}</p>
              </div>
            </div>
            )}
          </div>
        </FormSection>

        <FormSection
          icon={<Heart className="h-4 w-4" />}
          iconClassName="bg-rose-100 text-rose-800"
          title="Section 5: Emergency Contact"
          subtitle="Primary next-of-kin or emergency reference"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Contact Name">
              <TextInput name="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder="e.g. Sunita Nayak" className={inputClass} />
            </FormField>
            <FormField label="Relationship">
              <DropdownSelect
                value={formData.emergencyRelation || "Spouse"}
                onChange={(value) => updateField("emergencyRelation", value)}
                options={emergencyRelationOptions}
                aria-label="Emergency contact relationship"
              />
            </FormField>
            <FormField label="Mobile Number">
              <TextInput type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder="+91 98765 00000" className={inputClass} />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          icon={<FileText className="h-4 w-4" />}
          iconClassName="bg-teal-100 text-teal-800"
          title="Section 6: Documents & Verification"
          subtitle="Multiple document uploads (Aadhaar, PAN, resume, offer letter)"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Document Type">
              <DropdownSelect
                value={selectedDocType}
                onChange={setSelectedDocType}
                options={documentTypeOptions}
                aria-label="Document type"
              />
            </FormField>
            <FormField label="Choose File to Upload" className="sm:col-span-2">
              <input
                type="file"
                onChange={handleFileUpload}
                className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emerald-800"
              />
            </FormField>
          </div>
          {documents.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Uploaded Files ({documents.length})
              </p>
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-emerald-700" />
                    <div>
                      <p className="font-bold text-slate-900">
                        {doc.type}: <span className="font-normal text-slate-600">{doc.fileName}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Uploaded: {doc.uploadDate} · Size: {doc.size}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 hover:text-rose-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <ActionButtons
            isSubmitting={isSubmitting}
            onCancel={() => router.push("/human-resources/employees/list")}
            onReviewSave={handleReviewSave}
          />
        </div>
      </div>

      <AddEmployeePreviewModal
        open={showPreview}
        data={previewData}
        isSubmitting={isSubmitting}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmSave}
      />
    </ModulePageShell>
  );
}

