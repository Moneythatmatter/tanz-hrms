import type { EmployeePayrollRecord, PayrollAuditEntry, PayrollStatus } from "@/components/hr/ProcessPayrollView";
import type { EmployeeItem } from "@/app/data/hr/employeeListData";
import type { DepartmentMaster } from "@/components/hr/DepartmentMasterView";
import type { DesignationMaster } from "@/components/hr/DesignationMasterView";
import type { EmploymentTypeMaster } from "@/components/hr/EmploymentTypesMasterView";
import type { ShiftTypeMaster } from "@/components/hr/ShiftTypesMasterView";
import type { LeaveTypeMaster } from "@/components/hr/LeaveTypesMasterView";
import type { LeavePolicyMaster, LeavePolicyAllocation } from "@/components/hr/LeavePolicyMasterView";
import type { HolidayMaster } from "@/components/hr/HolidayCalendarMasterView";
import type { SalaryComponentMaster } from "@/components/hr/SalaryComponentsMasterView";
import type { MasterCategory, MasterDocumentType } from "@/components/hr/DocumentMastersView";
import type { AttendanceRecord } from "@/components/hr/AttendanceView";
import type { ShiftAssignment } from "@/components/hr/ShiftManagementView";
import type { WeeklyOffAssignment } from "@/components/hr/WeeklyOffView";
import type { LeaveApplication } from "@/components/hr/LeaveManagementView";
import type { OvertimeRecord } from "@/components/hr/OvertimeManagementView";
import type { SalaryStructure } from "@/components/hr/SalaryStructureView";
import type { PayslipRecord } from "@/components/hr/PayslipsView";
import type { ComplaintCategory } from "@/components/hr/ComplaintCategoriesView";
import type { ComplaintRecord } from "@/components/hr/ComplaintListView";
import type { GrievanceComplaint } from "@/components/hr/RaiseComplaintView";
import type { HRKpiSummary, GrievanceSummary, DepartmentHeadcount } from "@/app/data/hr/hrDashboardData";
import { normalizeToIsoDate } from "./report-export";
import { formatApiDate } from "./useHrList";
import { normalizeGrievanceStatus } from "./grievance-status";

export function mapPayrollFromApi(row: Record<string, unknown>): EmployeePayrollRecord {
  return {
    id: String(row.id),
    employeeId: String(row.employeeId),
    payrollMonth: Number(row.payrollMonth),
    payrollYear: Number(row.payrollYear),
    grossSalary: Number(row.grossSalary ?? 0),
    earningsTotal: Number(row.earningsTotal ?? 0),
    deductionsTotal: Number(row.deductionsTotal ?? 0),
    netSalary: Number(row.netSalary ?? 0),
    status: String(row.status ?? "Draft") as PayrollStatus,
    calculatedAt: row.calculatedAt as string | undefined,
    verifiedAt: row.verifiedAt as string | undefined,
    approvedAt: row.approvedAt as string | undefined,
    isLocked: Boolean(row.isLocked),
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? new Date().toISOString()),
    payrollId: String(row.payrollId ?? row.payrollBatchId ?? ""),
    employeeName: String(row.employeeName ?? ""),
    empCode: String(row.empCode ?? row.emp_code ?? ""),
    department: String(row.department ?? ""),
    employmentType: String(row.employmentType ?? row.employment_type ?? ""),
    designation: String(row.designation ?? ""),
    avatar: String(row.avatar ?? "??"),
    photoUrl: row.photoUrl as string | undefined,
    basicSalary: Number(row.basicSalary ?? 0),
    hra: Number(row.hra ?? 0),
    allowances: Number(row.allowances ?? 0),
    overtimePay: Number(row.overtimePay ?? 0),
    holidayPay: Number(row.holidayPay ?? 0),
    incentives: Number(row.incentives ?? 0),
    bonus: Number(row.bonus ?? 0),
    otherEarnings: Number(row.otherEarnings ?? 0),
    leaveDeduction: Number(row.leaveDeduction ?? 0),
    pfDeduction: Number(row.pfDeduction ?? 0),
    esiDeduction: Number(row.esiDeduction ?? 0),
    ptDeduction: Number(row.ptDeduction ?? 0),
    tdsDeduction: Number(row.tdsDeduction ?? 0),
    otherDeductions: Number(row.otherDeductions ?? 0),
    payslipGenerated: Boolean(row.payslipGenerated),
    hasAttendanceIssue: Boolean(row.hasAttendanceIssue),
    missingBankDetails: Boolean(row.missingBankDetails),
    missingSalaryStructure: Boolean(row.missingSalaryStructure),
    missingPan: Boolean(row.missingPan),
    pendingLeaveApproval: Boolean(row.pendingLeaveApproval),
    pendingOtApproval: Boolean(row.pendingOtApproval),
  };
}

export function mapAuditFromApi(row: Record<string, unknown>): PayrollAuditEntry {
  return {
    id: String(row.id),
    action: String(row.action ?? ""),
    changedBy: String(row.changedBy ?? ""),
    changedOn: String(row.changedOn ?? row.createdAt ?? ""),
    auditNotes: row.auditNotes as string | undefined,
    overrideReason: row.overrideReason as string | undefined,
  };
}

export function mapEmployeeFromApi(row: Record<string, unknown>): EmployeeItem {
  const leaveBalance = (row.leaveBalance as { casual?: number; sick?: number; earned?: number }) ?? {};
  return {
    id: String(row.id),
    empCode: String(row.empCode ?? ""),
    name: String(row.name ?? `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim()),
    avatar: String(row.avatar ?? "??"),
    photoUrl: row.photoUrl as string | undefined,
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    department: String(row.department ?? ""),
    designation: String(row.designation ?? ""),
    employmentType: (row.employmentType as EmployeeItem["employmentType"]) ?? "Permanent",
    shiftType: (row.shiftType as EmployeeItem["shiftType"]) ?? "General Shift",
    joinDate: formatApiDate(row.joinDate as string),
    lastUpdated: formatApiDate(row.updatedAt as string),
    salaryStructureId: String(row.salaryStructureId ?? ""),
    salaryStructureName: String(row.salaryStructureName ?? ""),
    structureGrossSalary: Number(row.structureGrossSalary ?? 0),
    structureNetSalary: Number(row.structureNetSalary ?? 0),
    status: (row.status as EmployeeItem["status"]) ?? "Active",
    gender: (row.gender as EmployeeItem["gender"]) ?? "Male",
    emergencyContact: String(row.emergencyContact ?? ""),
    attendanceRate: row.attendanceRate != null ? Number(row.attendanceRate) : undefined,
    leaveBalance: {
      casual: leaveBalance.casual ?? 0,
      sick: leaveBalance.sick ?? 0,
      earned: leaveBalance.earned ?? 0,
    },
    bankAccount: row.bankAccount as string | undefined,
    bankName: row.bankName as string | undefined,
    ifscCode: row.ifscCode as string | undefined,
    panNumber: row.panNumber as string | undefined,
    uanNumber: row.uanNumber as string | undefined,
    esicNumber: row.esicNumber as string | undefined,
  };
}

export function mapDepartmentFromApi(row: Record<string, unknown>): DepartmentMaster {
  return {
    id: String(row.id),
    deptCode: String(row.deptCode ?? ""),
    departmentName: String(row.departmentName ?? ""),
    headOfDepartment: String(row.headOfDepartment ?? ""),
    headEmail: row.headEmail as string | undefined,
    location: row.location as string | undefined,
    description: String(row.description ?? ""),
    status: (row.status as DepartmentMaster["status"]) ?? "Active",
    createdDate: formatApiDate(row.createdAt as string),
    employeeCount: Number(row.employeeCount ?? 0),
  };
}

export function mapDepartmentToApi(form: {
  deptCode: string;
  departmentName: string;
  headOfDepartment: string;
  headEmail?: string;
  location?: string;
  description: string;
  status: string;
}) {
  return {
    deptCode: form.deptCode,
    departmentName: form.departmentName,
    headOfDepartment: form.headOfDepartment,
    headEmail: form.headEmail ?? "",
    location: form.location ?? "",
    description: form.description,
    status: form.status,
  };
}

export function buildNameIdMap(rows: Record<string, unknown>[], nameKey: string) {
  return new Map(rows.map((r) => [String(r[nameKey] ?? ""), String(r.id)]));
}

export function buildIdNameMap(rows: Record<string, unknown>[], nameKey: string) {
  return new Map(rows.map((r) => [String(r.id), String(r[nameKey] ?? "")]));
}

export function mapDesignationFromApi(
  row: Record<string, unknown>,
  deptName = "",
): DesignationMaster {
  const title = String(
    row.designationTitle ??
      row.designation_title ??
      row.designationName ??
      row.designation_name ??
      row.name ??
      row.title ??
      "",
  );
  const code = String(row.designationCode ?? row.designation_code ?? "");
  const dept = deptName || String(row.departmentName ?? row.department_name ?? row.department ?? "");
  const grade = String(row.jobGrade ?? row.job_grade ?? "Executive (L1)");

  return {
    id: String(row.id),
    designationCode: code,
    designationTitle: title,
    department: dept,
    jobGrade: grade as DesignationMaster["jobGrade"],
    description: String(row.description ?? ""),
    status: ((row.status as DesignationMaster["status"]) ?? "Active") || "Active",
    createdDate: formatApiDate(row.createdAt as string),
    employeeCount: Number(row.employeeCount ?? row.employee_count ?? 0),
  };
}

export function mapDesignationToApi(
  form: {
    designationCode: string;
    designationTitle: string;
    departmentId: string;
    jobGrade: string;
    description: string;
    status: string;
  },
) {
  return {
    designationCode: form.designationCode,
    designationTitle: form.designationTitle,
    designationName: form.designationTitle,
    name: form.designationTitle,
    departmentId: form.departmentId,
    jobGrade: form.jobGrade,
    description: form.description,
    status: form.status,
  };
}

export function mapEmploymentTypeFromApi(row: Record<string, unknown>): EmploymentTypeMaster {
  return {
    id: String(row.id),
    typeCode: String(row.typeCode ?? ""),
    typeName: String(row.typeName ?? ""),
    workingTerm: (row.workingTerm as EmploymentTypeMaster["workingTerm"]) ?? "Full-Time",
    probationDays: Number(row.probationDays ?? 0),
    noticePeriodDays: Number(row.noticePeriodDays ?? 0),
    pfEligible: Boolean(row.pfEligible),
    esiEligible: Boolean(row.esiEligible),
    leaveEligible: Boolean(row.leaveEligible),
    description: String(row.description ?? ""),
    status: (row.status as EmploymentTypeMaster["status"]) ?? "Active",
    createdDate: formatApiDate(row.createdAt as string),
    employeeCount: Number(row.employeeCount ?? 0),
  };
}

export function mapEmploymentTypeToApi(form: Omit<EmploymentTypeMaster, "id" | "createdDate" | "employeeCount">) {
  return {
    typeCode: form.typeCode,
    typeName: form.typeName,
    workingTerm: form.workingTerm,
    probationDays: form.probationDays,
    noticePeriodDays: form.noticePeriodDays,
    pfEligible: form.pfEligible,
    esiEligible: form.esiEligible,
    leaveEligible: form.leaveEligible,
    description: form.description,
    status: form.status,
  };
}

export function mapShiftTypeFromApi(row: Record<string, unknown>): ShiftTypeMaster {
  return {
    id: String(row.id),
    shiftCode: String(row.shiftCode ?? ""),
    shiftName: String(row.shiftName ?? ""),
    category: (row.category as ShiftTypeMaster["category"]) ?? "General",
    startTime: String(row.startTime ?? ""),
    endTime: String(row.endTime ?? ""),
    breakDurationMinutes: Number(row.breakDurationMinutes ?? 0),
    totalWorkingHours: Number(row.totalWorkingHours ?? 0),
    isNightShift: Boolean(row.isNightShift),
    nightAllowanceEligible: Boolean(row.nightAllowanceEligible),
    description: String(row.description ?? ""),
    status: (row.status as ShiftTypeMaster["status"]) ?? "Active",
    createdDate: formatApiDate(row.createdAt as string),
    employeeCount: Number(row.employeeCount ?? 0),
  };
}

export function mapShiftTypeToApi(form: Omit<ShiftTypeMaster, "id" | "createdDate" | "employeeCount">) {
  return { ...form };
}

export function mapLeaveTypeFromApi(row: Record<string, unknown>): LeaveTypeMaster {
  return {
    id: String(row.id),
    leaveCode: String(row.leaveCode ?? ""),
    leaveName: String(row.leaveName ?? ""),
    annualQuotaDays: Number(row.annualQuotaDays ?? 0),
    payType: (row.payType as LeaveTypeMaster["payType"]) ?? "Paid",
    carryForwardAllowed: Boolean(row.carryForwardAllowed),
    maxCarryForwardDays: Number(row.maxCarryForwardDays ?? 0),
    encashable: Boolean(row.encashable),
    requiresMedicalProof: Boolean(row.requiresMedicalProof),
    description: String(row.description ?? ""),
    status: (row.status as LeaveTypeMaster["status"]) ?? "Active",
    createdDate: formatApiDate(row.createdAt as string),
    activeRequestsCount: Number(row.activeRequestsCount ?? 0),
  };
}

export function mapLeaveTypeToApi(form: Omit<LeaveTypeMaster, "id" | "createdDate" | "activeRequestsCount">) {
  return { ...form };
}

export function mapLeavePolicyFromApi(row: Record<string, unknown>): LeavePolicyMaster {
  const rawAllocations = (row.allocations as Array<Record<string, unknown>> | undefined) ?? [];
  const allocations: LeavePolicyAllocation[] = rawAllocations.map((a) => ({
    leaveTypeId: String(a.leaveTypeId ?? ""),
    leaveTypeName: String(a.leaveTypeName ?? ""),
    leaveCode: String(a.leaveCode ?? ""),
    annualQuotaDays: Number(a.annualQuotaDays ?? a.days ?? 0),
  }));
  return {
    id: String(row.id),
    policyCode: String(row.policyCode ?? ""),
    policyName: String(row.policyName ?? ""),
    totalAnnualDays: Number(row.totalAnnualDays ?? 0),
    applicableEmploymentTypes: (row.applicableEmploymentTypes as string[]) ?? [],
    allocations,
    description: String(row.description ?? ""),
    status: (row.status as LeavePolicyMaster["status"]) ?? "Active",
    createdDate: formatApiDate(row.createdAt as string),
    employeeCount: Number(row.employeeCount ?? 0),
  };
}

export function mapLeavePolicyToApi(form: Omit<LeavePolicyMaster, "id" | "createdDate" | "employeeCount">) {
  return {
    policyCode: form.policyCode,
    policyName: form.policyName,
    totalAnnualDays: form.totalAnnualDays,
    applicableEmploymentTypes: form.applicableEmploymentTypes,
    allocations: form.allocations.map(({ leaveTypeId, annualQuotaDays }) => ({
      leaveTypeId,
      days: annualQuotaDays,
    })),
    description: form.description,
    status: form.status,
  };
}

export function mapHolidayFromApi(row: Record<string, unknown>): HolidayMaster {
  const rawDepts = row.applicableDepartments;
  let applicableDepartments = "All Departments";
  if (typeof rawDepts === "string") {
    applicableDepartments = rawDepts;
  } else if (Array.isArray(rawDepts)) {
    applicableDepartments =
      rawDepts.length === 0 ? "All Departments" : rawDepts.map(String).join(", ");
  }

  return {
    id: String(row.id),
    holidayCode: String(row.holidayCode ?? ""),
    holidayName: String(row.holidayName ?? ""),
    holidayDate: formatApiDate(row.holidayDate as string),
    dayOfWeek: String(row.dayOfWeek ?? ""),
    category: (row.category as HolidayMaster["category"]) ?? "National",
    isMandatory: Boolean(row.isMandatory),
    extraPayMultiplier: Number(row.extraPayMultiplier ?? 1),
    applicableDepartments,
    description: String(row.description ?? ""),
    status: (row.status as HolidayMaster["status"]) ?? "Active",
    year: String(row.year ?? new Date().getFullYear()),
  };
}

export function mapHolidayToApi(form: Omit<HolidayMaster, "id">) {
  const applicableDepartments =
    form.applicableDepartments === "All Departments"
      ? ["All Departments"]
      : form.applicableDepartments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

  let formattedDate = form.holidayDate.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(formattedDate)) {
    const [d, m, y] = formattedDate.split("/");
    formattedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  } else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(formattedDate)) {
    const [d, m, y] = formattedDate.split("-");
    formattedDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const dayOfWeek = (() => {
    if (form.dayOfWeek?.trim()) return form.dayOfWeek;
    const d = new Date(`${formattedDate}T12:00:00`);
    if (isNaN(d.getTime())) return "";
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      d.getDay()
    ];
  })();

  return {
    holidayCode: form.holidayCode,
    holidayName: form.holidayName,
    holidayDate: formattedDate,
    dayOfWeek,
    category: form.category,
    isMandatory: form.isMandatory,
    extraPayMultiplier: form.extraPayMultiplier,
    applicableDepartments,
    description: form.description,
    status: form.status,
    year: Number(form.year) || new Date().getFullYear(),
  };
}


export function mapComplaintCategoryToApi(form: Omit<ComplaintCategory, "id" | "createdDate" | "complaintsCount">) {
  return {
    categoryName: form.categoryName,
    description: form.description,
    reviewLevel: form.reviewLevel,
    slaDays: form.slaDays,
    defaultPriority: form.defaultPriority,
    status: form.status,
  };
}

export function mapComplaintToApi(form: Record<string, unknown>) {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const ticketNo = form.ticketNo || form.ticket_no || `TCK-${year}-${rand}`;
  const submittedDate = form.submittedDate || form.submitted_date || new Date().toISOString().slice(0, 10);
  const dueDate =
    form.dueDate ||
    form.due_date ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return {
    ...form,
    ticketNo,
    submittedDate,
    dueDate,
  };
}

export function mapSalaryStructureToApi(form: Omit<SalaryStructure, "id" | "history">) {
  const effectiveFrom =
    normalizeToIsoDate(form.effectiveFrom) ?? form.effectiveFrom?.slice(0, 10);
  const effectiveToRaw =
    !form.effectiveTo || form.effectiveTo === "—" ? undefined : form.effectiveTo;
  const effectiveTo = effectiveToRaw
    ? normalizeToIsoDate(effectiveToRaw) ?? effectiveToRaw.slice(0, 10)
    : undefined;

  return {
    name: form.name,
    structureType: form.structureType,
    version: form.version,
    isCurrentVersion: form.isCurrentVersion,
    effectiveFrom,
    effectiveTo,
    description: form.description,
    status: form.status,
    overtimeEligible: form.overtimeEligible,
    incentives: Boolean(form.incentives),
    earnings: form.earnings,
    deductions: form.deductions,
    grossSalary: form.grossSalary,
    totalDeductions: form.totalDeductions,
    netSalary: form.netSalary,
    assignedEmployeeIds: form.assignedEmployees?.map((e) => e.id) ?? [],
    createdBy: form.createdBy,
  };
}

export function mapShiftAssignmentToApi(form: Partial<ShiftAssignment>) {
  return {
    employeeId: form.employeeId,
    shiftTypeId: form.shiftId,
    shiftCode: form.shiftCode,
    shiftName: form.shiftName,
    shiftCategory: form.shiftCategory,
    startTime: form.startTime,
    endTime: form.endTime,
    effectiveFrom: form.effectiveFrom,
    effectiveTo: form.effectiveTo,
    status: form.status,
    assignedBy: form.assignedBy,
    assignedOn: form.assignedOn,
    remarks: form.remarks,
    employmentType: form.employmentType,
  };
}

export function deriveWeeklyOffDisplayStatus(
  effectiveFrom: string,
  effectiveTo: string | undefined | null,
  today = new Date().toISOString().slice(0, 10),
): WeeklyOffAssignment["status"] {
  const from = (effectiveFrom.includes("/")
    ? effectiveFrom.split("/").reverse().join("-")
    : effectiveFrom
  ).slice(0, 10);
  const toRaw = effectiveTo && effectiveTo !== "—" ? effectiveTo : null;
  const to = toRaw
    ? (toRaw.includes("/") ? toRaw.split("/").reverse().join("-") : toRaw).slice(0, 10)
    : null;
  const t = today.slice(0, 10);
  if (t < from) return "Upcoming";
  if (to && t > to) return "Expired";
  return "Active";
}

export function mapWeeklyOffToApi(form: Partial<WeeklyOffAssignment>) {
  const fromIso = form.effectiveFrom?.includes("/")
    ? form.effectiveFrom.split("/").reverse().join("-")
    : form.effectiveFrom;
  const toRaw = form.effectiveTo && form.effectiveTo !== "—" ? form.effectiveTo : undefined;
  const toIso = toRaw?.includes("/") ? toRaw.split("/").reverse().join("-") : toRaw;

  return {
    employeeId: form.employeeId,
    offType: form.type,
    days: form.days,
    rotationPattern: form.rotationPattern,
    effectiveFrom: fromIso,
    effectiveTo: toIso,
    status: form.status ?? "Active",
    assignedBy: form.assignedBy,
    remarks: form.remarks,
  };
}

export function mapLeaveApplicationToApi(form: Partial<LeaveApplication>) {
  return {
    employeeId: form.employeeId,
    leaveTypeId: form.leaveTypeId,
    leaveTypeCode: form.leaveTypeCode,
    leaveTypeName: form.leaveTypeName,
    isPaid: form.isPaid,
    durationOption: form.durationOption,
    priority: form.priority,
    fromDate: form.fromDate,
    toDate: form.toDate,
    totalDays: form.totalDays,
    reason: form.reason,
    attachmentName: form.attachmentName,
    status: form.status,
    appliedOn: form.appliedOn,
    approvedBy: form.approvedBy,
    clarificationRequest: form.clarificationRequest,
    approvalChain: form.approvalChain,
    balances: form.balances,
  };
}

export function mapOvertimeToApi(form: Partial<OvertimeRecord>) {
  return {
    employeeId: form.employeeId,
    shiftCode: form.shiftCode,
    shiftName: form.shiftName,
    otType: form.otType,
    recordDate: form.date,
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    scheduledHours: form.scheduledHours,
    breakHours: form.breakHours,
    workedHours: form.workedHours,
    overtimeHours: form.overtimeHours,
    hourlyRate: form.hourlyRate,
    otRateMultiplier: form.otRateMultiplier,
    payableAmount: form.payableAmount,
    reason: form.reason,
    status: form.status,
    approvedBy: form.approvedBy,
    approvedOn: form.approvedOn,
    approvalRemarks: form.approvalRemarks,
  };
}

export function mapSalaryComponentFromApi(row: Record<string, unknown>): SalaryComponentMaster {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    type: (row.componentType as SalaryComponentMaster["type"]) ?? "Earning",
    calculationType: (row.calculationType as SalaryComponentMaster["calculationType"]) ?? "Flat Amount",
    defaultValue: Number(row.defaultValue ?? 0),
    isTaxable: Boolean(row.isTaxable),
    isPfApplicable: Boolean(row.isPfApplicable),
    isEsiApplicable: Boolean(row.isEsiApplicable),
    description: String(row.description ?? ""),
    status: (row.status as SalaryComponentMaster["status"]) ?? "Active",
    templateUsageCount: Number(row.templateUsageCount ?? row.usageCount ?? 0),
  };
}

export function mapSalaryComponentToApi(form: Omit<SalaryComponentMaster, "id" | "templateUsageCount">) {
  return {
    code: form.code,
    name: form.name,
    componentType: form.type,
    calculationType: form.calculationType,
    defaultValue: form.defaultValue,
    isTaxable: form.isTaxable,
    isPfApplicable: form.isPfApplicable,
    isEsiApplicable: form.isEsiApplicable,
    description: form.description,
    status: form.status,
  };
}

export function mapDocumentCategoryFromApi(row: Record<string, unknown>): MasterCategory {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    isMandatory: Boolean(row.isMandatory),
  };
}

export function mapDocumentCategoryToApi(form: Omit<MasterCategory, "id">) {
  return { ...form };
}

export function mapDocumentTypeFromApi(
  row: Record<string, unknown>,
  categoryName = "",
): MasterDocumentType {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    categoryId: String(row.categoryId ?? ""),
    categoryName,
    requiresExpiry: Boolean(row.requiresExpiry),
    isMandatory: Boolean(row.isMandatory),
    description: row.description as string | undefined,
  };
}

export function mapDocumentTypeToApi(form: Omit<MasterDocumentType, "id" | "categoryName">) {
  return {
    categoryId: form.categoryId,
    name: form.name,
    requiresExpiry: form.requiresExpiry,
    isMandatory: form.isMandatory,
    description: form.description ?? "",
  };
}

type EmployeeLookup = {
  name?: string;
  empCode?: string;
  department?: string;
  designation?: string;
  avatar?: string;
  photoUrl?: string;
  shiftType?: string;
};

function formatPunchTime(value: unknown): string {
  if (value == null || value === "" || value === "—") return "—";
  const text = String(value);
  if (/^\d{1,2}:\d{2}/.test(text) && !text.includes("T")) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function parseTime12hToMinutes(time: string): number | null {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function buildPunchTimestamp(dateIso: string, time12h: string): string | null {
  const minutes = parseTime12hToMinutes(time12h);
  if (minutes == null) return null;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day, hours, mins, 0).toISOString();
}

const ATTENDANCE_STATUS_FROM_API: Record<string, AttendanceRecord["status"]> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LEAVE: "On Leave",
  HOLIDAY: "Holiday",
  WEEKLY_OFF: "Weekly Off",
  PENDING: "Pending",
};

const ATTENDANCE_STATUS_TO_API: Record<string, string> = {
  Present: "PRESENT",
  Late: "PRESENT",
  "Half Day": "PRESENT",
  Absent: "ABSENT",
  "On Leave": "LEAVE",
  "Weekly Off": "WEEKLY_OFF",
  Holiday: "HOLIDAY",
  Pending: "PENDING",
};

export function mapAttendanceFromApi(
  row: Record<string, unknown>,
  emp?: EmployeeLookup,
): AttendanceRecord {
  const dateRaw = (row.attendanceDate ?? row.recordDate) as string | undefined;
  const apiStatus = String(row.attendanceStatus ?? row.status ?? "PRESENT");
  let status = ATTENDANCE_STATUS_FROM_API[apiStatus.toUpperCase()] ?? "Present";
  const remarks = String(row.remarks ?? row.manualReason ?? "");
  if (remarks.toLowerCase().includes("late") && status === "Present") {
    status = "Late";
  }

  const shiftName = String(row.shiftName ?? emp?.shiftType ?? "General Shift");
  const shiftCode = String(row.shiftCode ?? shiftName.split(" ")[0]?.slice(0, 5).toUpperCase() ?? "GEN");
  const scheduled = Number(row.scheduledHours ?? row.expectedHours ?? 0);

  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? ""),
    employeeName: emp?.name ?? String(row.employeeName ?? ""),
    department: emp?.department ?? String(row.department ?? ""),
    designation: emp?.designation ?? String(row.designation ?? ""),
    avatar: emp?.avatar ?? String(row.avatar ?? "??"),
    photoUrl: emp?.photoUrl,
    shiftId: row.shiftId as string | undefined,
    shiftCode,
    shiftName,
    date: formatApiDate(dateRaw),
    dayType: (row.dayType as AttendanceRecord["dayType"]) ?? "WORKING_DAY",
    checkIn: formatPunchTime(row.punchIn ?? row.checkIn),
    checkOut: formatPunchTime(row.punchOut ?? row.checkOut),
    scheduledHours: scheduled,
    workedHours: Number(row.workedHours ?? 0),
    extraHours: Number(row.extraHours ?? row.overtimeHours ?? 0),
    expectedHours: scheduled || 8,
    status,
    deviceType: "Manual Entry",
    isManualEntry: String(row.source ?? "MANUAL") === "MANUAL",
    manualReason: remarks || undefined,
    holidayWorked: Boolean(row.holidayWorked),
    leaveRequestId: row.leaveRequestId as string | undefined,
    holidayId: row.holidayId as string | undefined,
    holidayName: (row.holidayName as string | null) ?? null,
    leaveTypeName: (row.leaveTypeName as string | null) ?? null,
    source: (row.source as AttendanceRecord["source"]) ?? "MANUAL",
  };
}

export function mapAttendanceToApi(
  form: Partial<AttendanceRecord> & { recordDate?: string; attendanceDate?: string },
) {
  const date = form.attendanceDate ?? form.recordDate ?? form.date;
  const attendanceStatus =
    ATTENDANCE_STATUS_TO_API[form.status ?? "Present"] ?? "PRESENT";
  const dayType =
    attendanceStatus === "WEEKLY_OFF"
      ? "WEEKLY_OFF"
      : attendanceStatus === "HOLIDAY"
        ? "HOLIDAY"
        : form.dayType ?? "WORKING_DAY";

  const punchIn =
    form.checkIn && form.checkIn !== "—" && date
      ? buildPunchTimestamp(date, form.checkIn)
      : undefined;
  const punchOut =
    form.checkOut && form.checkOut !== "—" && date
      ? buildPunchTimestamp(date, form.checkOut)
      : undefined;

  return {
    employeeId: form.employeeId,
    attendanceDate: date,
    dayType,
    attendanceStatus,
    punchIn,
    punchOut,
    holidayWorked: form.holidayWorked ?? false,
    leaveRequestId: form.leaveRequestId,
    holidayId: form.holidayId,
    remarks:
      form.status === "Late"
        ? form.manualReason || "Late arrival"
        : form.manualReason,
    source: form.source ?? "MANUAL",
  };
}

export function mapShiftAssignmentFromApi(
  row: Record<string, unknown>,
  emp?: EmployeeLookup,
): ShiftAssignment {
  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? row.employee_id ?? ""),
    empCode: emp?.empCode ?? String(row.empCode ?? row.emp_code ?? ""),
    employeeName: emp?.name ?? String(row.employeeName ?? row.employee_name ?? ""),
    department: emp?.department ?? String(row.department ?? row.dept_name ?? ""),
    designation: emp?.designation ?? String(row.designation ?? row.designation_name ?? ""),
    employmentType: ((row.employmentType ?? row.employment_type ?? "Permanent") as ShiftAssignment["employmentType"]) || "Permanent",
    avatar: emp?.avatar ?? String(row.avatar ?? "??"),
    photoUrl: emp?.photoUrl ?? (row.photoUrl as string | undefined) ?? (row.photo_url as string | undefined),
    shiftId: String(row.shiftTypeId ?? row.shift_type_id ?? row.shiftId ?? row.shift_id ?? ""),
    shiftCode: String(row.shiftCode ?? row.shift_code ?? ""),
    shiftName: String(row.shiftName ?? row.shift_name ?? ""),
    shiftCategory: ((row.shiftCategory ?? row.shift_category ?? "General") as ShiftAssignment["shiftCategory"]) || "General",
    startTime: String(row.startTime ?? row.start_time ?? ""),
    endTime: String(row.endTime ?? row.end_time ?? ""),
    effectiveFrom: formatApiDate((row.effectiveFrom ?? row.effective_from) as string),
    effectiveTo: (row.effectiveTo || row.effective_to) ? formatApiDate((row.effectiveTo ?? row.effective_to) as string) : undefined,
    status: ((row.status as ShiftAssignment["status"]) ?? "Active") || "Active",
    assignedBy: String(row.assignedBy ?? row.assigned_by ?? "HR Admin"),
    assignedOn: formatApiDate((row.assignedOn ?? row.assigned_on ?? row.createdAt ?? row.created_at) as string),
    remarks: (row.remarks as string | undefined) ?? "",
    history: (row.history as ShiftAssignment["history"]) ?? [],
  };
}

export function mapWeeklyOffFromApi(
  row: Record<string, unknown>,
  emp?: EmployeeLookup,
): WeeklyOffAssignment {
  const offType = String(row.offType ?? row.type ?? "Fixed");
  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? ""),
    employeeName: emp?.name ?? String(row.employeeName ?? ""),
    department: emp?.department ?? String(row.department ?? ""),
    designation: emp?.designation ?? String(row.designation ?? ""),
    avatar: emp?.avatar ?? String(row.avatar ?? "??"),
    photoUrl: emp?.photoUrl,
    type: (offType === "Rotational" ? "Rotational" : "Fixed") as WeeklyOffAssignment["type"],
    days: (row.days as string[]) ?? [],
    rotationPattern: row.rotationPattern as string | undefined,
    effectiveFrom: formatApiDate(row.effectiveFrom as string),
    effectiveTo: row.effectiveTo ? formatApiDate(row.effectiveTo as string) : "—",
    status: deriveWeeklyOffDisplayStatus(
      String(row.effectiveFrom ?? ""),
      row.effectiveTo as string | undefined,
    ),
    assignedBy: String(row.assignedBy ?? ""),
    remarks: row.remarks as string | undefined,
  };
}

export function mapLeaveApplicationFromApi(
  row: Record<string, unknown>,
  emp?: EmployeeLookup,
): LeaveApplication {
  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? ""),
    employeeName: emp?.name ?? String(row.employeeName ?? ""),
    department: emp?.department ?? String(row.department ?? ""),
    designation: emp?.designation ?? String(row.designation ?? ""),
    avatar: emp?.avatar ?? String(row.avatar ?? "??"),
    photoUrl: emp?.photoUrl,
    leaveTypeId: String(row.leaveTypeId ?? ""),
    leaveTypeCode: String(row.leaveTypeCode ?? ""),
    leaveTypeName: String(row.leaveTypeName ?? ""),
    isPaid: Boolean(row.isPaid),
    durationOption: (row.durationOption as LeaveApplication["durationOption"]) ?? "Full Day",
    priority: (row.priority as LeaveApplication["priority"]) ?? "Normal",
    fromDate: formatApiDate(row.fromDate as string),
    toDate: formatApiDate(row.toDate as string),
    fromDateIso: String(row.fromDate ?? "").slice(0, 10),
    toDateIso: String(row.toDate ?? "").slice(0, 10),
    totalDays: Number(row.totalDays ?? 0),
    effectiveDays: row.effectiveDays != null ? Number(row.effectiveDays) : undefined,
    calendarDays: row.calendarDays != null ? Number(row.calendarDays) : undefined,
    consumedDates: (row.consumedDates as string[] | undefined) ?? undefined,
    excludedDates: (row.excludedDates as LeaveApplication["excludedDates"]) ?? undefined,
    reason: String(row.reason ?? ""),
    attachmentName: row.attachmentName as string | undefined,
    status: (row.status as LeaveApplication["status"]) ?? "Pending",
    appliedOn: formatApiDate(row.appliedOn as string),
    approvedBy: row.approvedBy as string | undefined,
    clarificationRequest: row.clarificationRequest as string | undefined,
    approvalChain: (row.approvalChain as LeaveApplication["approvalChain"]) ?? [],
    balances: (row.balances as LeaveApplication["balances"]) ?? {},
  };
}

export function mapOvertimeFromApi(row: Record<string, unknown>, emp?: EmployeeLookup): OvertimeRecord {
  return {
    id: String(row.id),
    employeeId: String(row.employeeId ?? row.employee_id ?? ""),
    employeeName: emp?.name ?? String(row.employeeName ?? row.employee_name ?? ""),
    department: emp?.department ?? String(row.department ?? row.dept_name ?? ""),
    designation: emp?.designation ?? String(row.designation ?? row.designation_name ?? ""),
    avatar: emp?.avatar ?? String(row.avatar ?? "??"),
    photoUrl: emp?.photoUrl ?? (row.photoUrl as string | undefined) ?? (row.photo_url as string | undefined),
    shiftCode: String(row.shiftCode ?? row.shift_code ?? ""),
    shiftName: String(row.shiftName ?? row.shift_name ?? ""),
    otType: ((row.otType ?? row.ot_type ?? "Regular OT") as OvertimeRecord["otType"]) || "Regular OT",
    date: formatApiDate((row.recordDate ?? row.record_date ?? row.date) as string),
    checkIn: String(row.checkIn ?? row.check_in ?? "—"),
    checkOut: String(row.checkOut ?? row.check_out ?? "—"),
    scheduledHours: Number(row.scheduledHours ?? row.scheduled_hours ?? 8),
    breakHours: Number(row.breakHours ?? row.break_hours ?? 0),
    workedHours: Number(row.workedHours ?? row.worked_hours ?? 0),
    overtimeHours: Number(row.overtimeHours ?? row.overtime_hours ?? 0),
    hourlyRate: Number(row.hourlyRate ?? row.hourly_rate ?? 0),
    otRateMultiplier: Number(row.otRateMultiplier ?? row.ot_rate_multiplier ?? 1.5),
    payableAmount: Number(row.payableAmount ?? row.payable_amount ?? 0),
    reason: String(row.reason ?? ""),
    status: ((row.status as OvertimeRecord["status"]) ?? "Pending") || "Pending",
    approvedBy: (row.approvedBy as string | undefined) ?? (row.approved_by as string | undefined),
    approvedOn: (row.approvedOn || row.approved_on) ? formatApiDate((row.approvedOn ?? row.approved_on) as string) : undefined,
    approvalRemarks: (row.approvalRemarks as string | undefined) ?? (row.approval_remarks as string | undefined),
  };
}

export function mapSalaryStructureFromApi(row: Record<string, unknown>): SalaryStructure {
  const assignedIds = (row.assignedEmployeeIds as string[]) ?? [];
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    department: String(row.department ?? row.departmentId ?? ""),
    employmentType: (row.employmentType as SalaryStructure["employmentType"]) ?? "All",
    structureType: (row.structureType as SalaryStructure["structureType"]) ?? "Grade-Based",
    version: Number(row.version ?? 1),
    isCurrentVersion: Boolean(row.isCurrentVersion ?? true),
    effectiveFrom: formatApiDate(row.effectiveFrom as string),
    effectiveTo: row.effectiveTo ? formatApiDate(row.effectiveTo as string) : undefined,
    description: String(row.description ?? ""),
    status: (row.status as SalaryStructure["status"]) ?? "Active",
    overtimeEligible: Boolean(row.overtimeEligible),
    incentives: Number(row.incentives ?? 0),
    earnings: (row.earnings as SalaryStructure["earnings"]) ?? [],
    deductions: (row.deductions as SalaryStructure["deductions"]) ?? [],
    grossSalary: Number(row.grossSalary ?? 0),
    totalDeductions: Number(row.totalDeductions ?? 0),
    netSalary: Number(row.netSalary ?? 0),
    assignedEmployees: assignedIds.map((id) => ({
      id,
      name: String(id),
      department: "",
      designation: "",
      avatar: "??",
    })),
    createdBy: String(row.createdBy ?? ""),
    createdDate: formatApiDate(row.createdAt as string),
    lastUpdated: formatApiDate(row.updatedAt as string),
    history: (row.history as SalaryStructure["history"]) ?? [],
  };
}

export function mapPayslipFromApi(row: Record<string, unknown>, emp?: EmployeeLookup): PayslipRecord {
  const earnings = (row.earnings as Record<string, number>) ?? {};
  const deductions = (row.deductions as Record<string, number>) ?? {};
  return {
    id: String(row.id),
    payslipNo: String(row.payslipNo ?? ""),
    employeeId: String(row.employeeId ?? ""),
    employeeName: emp?.name ?? String(row.employeeName ?? ""),
    department: emp?.department ?? String(row.department ?? ""),
    designation: emp?.designation ?? String(row.designation ?? ""),
    avatar: emp?.avatar ?? String(row.avatar ?? "??"),
    photoUrl: emp?.photoUrl,
    month: String(row.monthLabel ?? row.month ?? ""),
    payPeriod: String(row.payPeriod ?? ""),
    generatedDate: formatApiDate(row.generatedDate as string),
    paymentMode: String(row.paymentMode ?? ""),
    bankName: String(row.bankName ?? ""),
    bankAccountNo: String(row.bankAccountNo ?? row.bankAccount ?? ""),
    panNo: String(row.panNo ?? row.panNumber ?? ""),
    pfNo: String(row.pfNo ?? ""),
    workedDays: Number(row.workedDays ?? 0),
    paidLeaves: Number(row.paidLeaves ?? 0),
    unpaidLeaves: Number(row.unpaidLeaves ?? 0),
    basicSalary: Number(earnings.basicSalary ?? row.basicSalary ?? 0),
    hra: Number(earnings.hra ?? row.hra ?? 0),
    allowances: Number(earnings.allowances ?? row.allowances ?? 0),
    overtimePay: Number(earnings.overtimePay ?? row.overtimePay ?? 0),
    holidayPay: Number(earnings.holidayPay ?? row.holidayPay ?? 0),
    grossSalary: Number(row.grossSalary ?? 0),
    pfDeduction: Number(deductions.pfDeduction ?? row.pfDeduction ?? 0),
    esiDeduction: Number(deductions.esiDeduction ?? row.esiDeduction ?? 0),
    ptDeduction: Number(deductions.ptDeduction ?? row.ptDeduction ?? 0),
    taxDeduction: Number(deductions.taxDeduction ?? row.tdsDeduction ?? 0),
    leaveDeduction: Number(deductions.leaveDeduction ?? row.leaveDeduction ?? 0),
    totalDeductions: Number(row.totalDeductions ?? 0),
    netSalary: Number(row.netSalary ?? 0),
    status: (row.status as PayslipRecord["status"]) ?? "Generated",
    sentDate: row.sentDate ? formatApiDate(row.sentDate as string) : undefined,
  };
}


export function mapComplaintCategoryFromApi(row: Record<string, unknown>): ComplaintCategory {
  const slaRaw = row.slaDays ?? row.sla_days;
  const priorityRaw = row.defaultPriority ?? row.default_priority;
  return {
    id: String(row.id),
    categoryName: String(row.categoryName ?? row.category_name ?? ""),
    description: String(row.description ?? ""),
    reviewLevel: (row.reviewLevel as ComplaintCategory["reviewLevel"]) ?? "Standard",
    slaDays: Number(slaRaw ?? 7) || 7,
    defaultPriority:
      (priorityRaw as ComplaintCategory["defaultPriority"]) ?? "Medium",
    status: (row.status as ComplaintCategory["status"]) ?? "Active",
    createdDate: formatApiDate(row.createdAt as string),
    complaintsCount: Number(row.complaintsCount ?? row.ticketCount ?? 0),
  };
}

export function mapComplaintFromApi(row: Record<string, unknown>, emp?: EmployeeLookup): ComplaintRecord {
  const empName = emp?.name ?? String(row.employeeName ?? row.employee_name ?? "");
  const dept = emp?.department ?? String(row.department ?? "");
  const desig = emp?.designation ?? String(row.designation ?? "");
  const avatar = emp?.avatar ?? (empName ? empName.slice(0, 2).toUpperCase() : "??");
  const photoUrl = emp?.photoUrl ?? (row.photoUrl as string | undefined);

  return {
    id: String(row.id),
    ticketNo: String(row.ticketNo ?? row.ticket_no ?? ""),
    employeeId: String(row.employeeId ?? row.employee_id ?? ""),
    employeeName: empName,
    department: dept,
    designation: desig,
    avatar,
    photoUrl,
    category: String(row.category ?? ""),
    subject: String(row.subject ?? ""),
    description: String(row.description ?? ""),
    incidentDate: formatApiDate((row.incidentDate ?? row.incident_date) as string),
    priority: ((row.priority as ComplaintRecord["priority"]) ?? "Medium") || "Medium",
    status: ((row.status as ComplaintRecord["status"]) ?? "Open") || "Open",
    reviewLevel: (row.reviewLevel as ComplaintRecord["reviewLevel"]) ?? "Standard",
    submittedDate: formatApiDate((row.submittedDate ?? row.submitted_date) as string),
    dueDate: formatApiDate((row.dueDate ?? row.due_date) as string),
    isAnonymous: Boolean(row.isAnonymous ?? row.is_anonymous),
    isPoshOrConfidential: Boolean(row.isPoshOrConfidential ?? row.is_posh_or_confidential),
    assignedOfficer: (row.assignedOfficer ?? row.assigned_officer) as string | undefined,
    assignedRole: (row.assignedRole ?? row.assigned_role) as string | undefined,
    assignedDate: (row.assignedDate || row.assigned_date)
      ? formatApiDate((row.assignedDate ?? row.assigned_date) as string)
      : undefined,
    assignedBy: (row.assignedBy ?? row.assigned_by) as string | undefined,
    investigationNotes:
      ((row.investigationNotes ?? row.investigation_notes) as ComplaintRecord["investigationNotes"]) ?? [],
    evidenceDocuments: ((row.evidenceDocuments ?? row.evidence_documents) as string[]) ?? [],
    reviewChain: ((row.reviewChain ?? row.review_chain) as ComplaintRecord["reviewChain"]) ?? [],
    proposedResolution: (row.proposedResolution ?? row.proposed_resolution) as string | undefined,
    resolutionNotes: (row.resolutionNotes ?? row.resolution_notes) as string | undefined,
    recommendedAction: (row.recommendedAction ?? row.recommended_action) as string | undefined,
    timeline: (row.timeline as ComplaintRecord["timeline"]) ?? [],
  };
}

export function mapComplaintToGrievance(row: Record<string, unknown>, emp?: EmployeeLookup): GrievanceComplaint {
  const empName = emp?.name ?? String(row.employeeName ?? row.employee_name ?? "");
  const dept = emp?.department ?? String(row.department ?? "");
  const desig = emp?.designation ?? String(row.designation ?? "");
  const avatar = emp?.avatar ?? (empName ? empName.slice(0, 2).toUpperCase() : "??");
  const photoUrl = emp?.photoUrl ?? (row.photoUrl as string | undefined);

  return {
    id: String(row.id),
    ticketNo: String(row.ticketNo ?? row.ticket_no ?? ""),
    employeeId: String(row.employeeId ?? row.employee_id ?? ""),
    employeeName: empName,
    department: dept,
    designation: desig,
    avatar,
    photoUrl,
    category: String(row.category ?? ""),
    subject: String(row.subject ?? ""),
    description: String(row.description ?? ""),
    incidentDate: formatApiDate((row.incidentDate ?? row.incident_date) as string),
    priority: ((row.priority as GrievanceComplaint["priority"]) ?? "Medium") || "Medium",
    status: normalizeGrievanceStatus(String(row.status ?? "Submitted")),
    submittedDate: formatApiDate((row.submittedDate ?? row.submitted_date) as string),
    submittedDateIso: String(row.submittedDate ?? row.submitted_date ?? "").slice(0, 10),
    dueDate: formatApiDate((row.dueDate ?? row.due_date) as string),
    dueDateIso: String(row.dueDate ?? row.due_date ?? "").slice(0, 10) || undefined,
    isAnonymous: Boolean(row.isAnonymous ?? row.is_anonymous),
    assignedTo: (row.assignedOfficer ?? row.assigned_officer) as string | undefined,
    attachmentName: (row.attachmentName ?? row.attachment_name) as string | undefined,
    resolutionNotes: (row.resolutionNotes ??
      row.resolution_notes ??
      row.proposedResolution ??
      row.proposed_resolution) as string | undefined,
  };
}

export function mapEmployeeToApi(form: Record<string, unknown>, lookups?: {
  departmentNameToId?: Map<string, string>;
  designationNameToId?: Map<string, string>;
  employmentTypeNameToId?: Map<string, string>;
  shiftTypeNameToId?: Map<string, string>;
  leavePolicyNameToId?: Map<string, string>;
}) {
  const departmentId =
    form.departmentId ??
    (lookups?.departmentNameToId?.get(String(form.department ?? "")) ?? undefined);
  const designationId =
    form.designationId ??
    (lookups?.designationNameToId?.get(String(form.designation ?? "")) ?? undefined);
  const employmentTypeId =
    form.employmentTypeId ??
    (lookups?.employmentTypeNameToId?.get(String(form.employmentType ?? "")) ?? undefined);
  const shiftTypeId =
    form.shiftTypeId ??
    (lookups?.shiftTypeNameToId?.get(String(form.shiftType ?? "")) ?? undefined);
  const leavePolicyId =
    form.leavePolicyId ??
    (lookups?.leavePolicyNameToId?.get(String(form.leavePolicy ?? "")) ?? undefined);

  return {
    empCode: form.empCode,
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.personalEmail ?? form.email,
    phone: form.phone,
    departmentId,
    designationId,
    employmentTypeId,
    shiftTypeId,
    leavePolicyId,
    joinDate: form.joinDate,
    salaryStructureId: form.salaryStructureId ?? form.salaryStructure ?? undefined,
    status: form.status ?? "Active",
    gender: form.gender,
    dob: form.dob,
    address: form.address,
    bloodGroup: form.bloodGroup,
    emergencyContact: form.emergencyPhone ?? form.emergencyContact,
    reportingManager: form.reportingManager,
    bankAccount: form.accountNumber ?? form.bankAccount,
    bankName: form.bankName,
    ifscCode: form.ifscCode,
    panNumber: form.panNumber,
    uanNumber: form.uanNumber,
    esicNumber: form.esicNumber,
  };
}

export function mapDashboardFromApi(data: Record<string, unknown>) {
  const kpi = (data.kpi as Record<string, unknown>) ?? {};
  const grievances = (data.grievances as Record<string, unknown>) ?? {};
  const departmentHeadcounts = (data.departmentHeadcounts as Record<string, unknown>[]) ?? [];
  const attendanceBreakdownRaw = (data.attendanceBreakdown as Record<string, unknown>) ?? {};
  const weeklyTrend = (data.weeklyTrend as { day: string; present: number }[]) ?? [];
  const designationHeadcountsRaw = (data.designationHeadcounts as Record<string, unknown>[]) ?? [];
  const genderRaw = (data.genderDistribution as Record<string, unknown>) ?? {};

  const kpiSummary: HRKpiSummary = {
    totalEmployees: Number(kpi.totalEmployees ?? 0),
    newJoineesThisMonth: Number(kpi.newJoineesThisMonth ?? 0),
    presentCount: Number(kpi.presentCount ?? 0),
    totalShiftStaff: Number(kpi.activeEmployees ?? kpi.totalEmployees ?? 0),
    attendanceRate: Number(kpi.attendanceRate ?? 0),
    onLeaveCount: Number(kpi.onLeaveCount ?? 0),
    pendingLeaveRequestsCount: Number(kpi.pendingLeaveRequestsCount ?? 0),
    payrollProcessedCount: Number(kpi.payrollProcessedCount ?? 0),
    payrollPendingCount: Number(kpi.payrollPendingCount ?? 0),
    payCycleDate: String(kpi.payCycleDate ?? "—"),
  };

  const deptHeadcounts: DepartmentHeadcount[] = departmentHeadcounts.map((d) => ({
    department: String(d.department ?? ""),
    count: Number(d.count ?? 0),
    color: "",
  }));

  const grievanceSummary: GrievanceSummary = {
    submitted: Number(grievances.submitted ?? grievances.open ?? 0),
    pending: Number(grievances.pending ?? grievances.inProgress ?? 0),
    closed: Number(grievances.closed ?? grievances.resolved ?? 0),
  };

  const attendanceBreakdown = {
    present: Number(attendanceBreakdownRaw.present ?? 0),
    absent: Number(attendanceBreakdownRaw.absent ?? 0),
    onLeave: Number(attendanceBreakdownRaw.onLeave ?? 0),
    lateArrivals: Number(attendanceBreakdownRaw.lateArrivals ?? 0),
  };

  const designationHeadcounts = designationHeadcountsRaw.map((d) => ({
    designation: String(d.designation ?? ""),
    department: String(d.department ?? ""),
    count: Number(d.count ?? 0),
    color: "bg-emerald-500",
  }));

  const rawMale = Number(genderRaw.male ?? 0);
  const rawFemale = Number(genderRaw.female ?? 0);
  const rawOther = Number(genderRaw.other ?? 0);
  const sumGender = rawMale + rawFemale + rawOther;
  const genderTotal = Number(genderRaw.total ?? (sumGender > 0 ? sumGender : kpiSummary.totalEmployees));

  const genderDistribution = {
    male: sumGender > 0 ? rawMale : genderTotal,
    female: rawFemale,
    other: rawOther,
    total: genderTotal,
  };

  const events = ((data.events as Record<string, unknown>[]) ?? []).map((e) => ({
    id: String(e.id ?? ""),
    name: String(e.name ?? ""),
    avatar: String(e.avatar ?? "??"),
    department: String(e.department ?? ""),
    type: (e.type as "birthday" | "anniversary") ?? "birthday",
    date: String(e.date ?? ""),
    years: e.years != null ? Number(e.years) : undefined,
  }));

  const holidaysAndShifts = ((data.holidaysAndShifts as Record<string, unknown>[]) ?? []).map((h) => ({
    id: String(h.id ?? ""),
    title: String(h.title ?? ""),
    date: String(h.date ?? ""),
    type: (h.type as "holiday" | "shift_exception") ?? "holiday",
    badgeText: String(h.badgeText ?? "Holiday"),
  }));

  const activities = ((data.activities as Record<string, unknown>[]) ?? []).map((a) => ({
    id: String(a.id ?? ""),
    type: (a.type as "join" | "leave" | "attendance" | "payroll" | "grievance") ?? "join",
    title: String(a.title ?? ""),
    description: String(a.description ?? ""),
    timeAgo: String(a.timeAgo ?? ""),
  }));

  return {
    kpiSummary,
    deptHeadcounts,
    grievanceSummary,
    attendanceBreakdown,
    weeklyTrend,
    designationHeadcounts,
    genderDistribution,
    events,
    holidaysAndShifts,
    activities,
  };
}
