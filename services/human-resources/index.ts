import { api } from "../api";

export const hrPath = (segment: string) =>
  `/api/human-resources${segment.startsWith("/") ? segment : `/${segment}`}`;

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(hrPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(hrPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(hrPath(base), body),
    update: (id: string, body: Partial<T>) => api.put<T>(hrPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(hrPath(`${base}/${id}`)),
  };
}

export const hrDashboardService = {
  get: () => api.get<Record<string, unknown>>(hrPath("/dashboard")),
};

export const hrEmployeeService = {
  list: () => api.get<Record<string, unknown>[]>(hrPath("/employees")),
  get: (id: string) => api.get<Record<string, unknown>>(hrPath(`/employees/${id}`)),
  create: (body: Record<string, unknown>) => api.post(hrPath("/employees"), body),
  update: (id: string, body: Record<string, unknown>) => api.put(hrPath(`/employees/${id}`), body),
  remove: (id: string) => api.delete(hrPath(`/employees/${id}`)),
};

export const hrCompensationService = {
  listAllRevisions: (params?: {
    search?: string;
    status?: string;
    revisionType?: string;
    department?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.revisionType) qs.set("revisionType", params.revisionType);
    if (params?.department) qs.set("department", params.department);
    if (params?.effectiveFrom) qs.set("effectiveFrom", params.effectiveFrom);
    if (params?.effectiveTo) qs.set("effectiveTo", params.effectiveTo);
    const q = qs.toString() ? `?${qs}` : "";
    return api.get<Record<string, unknown>[]>(hrPath(`/compensation/revisions${q}`));
  },
  approveRevisionById: (revisionId: string, approvedBy?: string) =>
    api.post(hrPath(`/compensation/revisions/${revisionId}/approve`), { approvedBy }),
  getSummary: (employeeId: string) =>
    api.get<Record<string, unknown>>(hrPath(`/employees/${employeeId}/compensation`)),
  listRevisions: (employeeId: string) =>
    api.get<Record<string, unknown>[]>(hrPath(`/employees/${employeeId}/compensation/revisions`)),
  previewIncrement: (
    employeeId: string,
    body: {
      incrementType: "percentage" | "fixed" | "new_gross";
      incrementValue: number;
      effectiveFrom?: string;
    },
  ) => api.post<Record<string, unknown>>(hrPath(`/employees/${employeeId}/compensation/preview`), body),
  submitRevision: (
    employeeId: string,
    body: {
      incrementType: "percentage" | "fixed" | "new_gross";
      incrementValue: number;
      effectiveFrom: string;
      reason?: string;
      remarks?: string;
      createdBy?: string;
      autoApprove?: boolean;
    },
  ) => api.post(hrPath(`/employees/${employeeId}/compensation/revisions`), body),
  approveRevision: (employeeId: string, revisionId: string, approvedBy?: string) =>
    api.post(hrPath(`/employees/${employeeId}/compensation/revisions/${revisionId}/approve`), {
      approvedBy,
    }),
  createInitial: (employeeId: string, createdBy?: string) =>
    api.post(hrPath(`/employees/${employeeId}/compensation/initial`), { createdBy }),
  listBonusAwards: (employeeId: string) =>
    api.get<Record<string, unknown>[]>(hrPath(`/employees/${employeeId}/bonus-awards`)),
  createBonusAward: (
    employeeId: string,
    body: {
      payrollMonth: number;
      payrollYear: number;
      amount: number;
      reason?: string;
      remarks?: string;
      createdBy?: string;
    },
  ) => api.post(hrPath(`/employees/${employeeId}/bonus-awards`), body),
};

export const hrPayrollService = {
  listRecords: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));
    const q = params.toString() ? `?${params}` : "";
    return api.get<Record<string, unknown>[]>(hrPath(`/payroll/records${q}`));
  },
  getSummary: (month: number, year: number) =>
    api.get<Record<string, unknown>>(hrPath(`/payroll/summary?month=${month}&year=${year}`)),
  getRecord: (id: string) => api.get<Record<string, unknown>>(hrPath(`/payroll/records/${id}`)),
  calculatePayroll: (body: {
    month: number;
    year: number;
    employeeIds?: string[];
    changedBy?: string;
  }) => api.post<Record<string, unknown>>(hrPath("/payroll/records/calculate"), body),
  updateRecord: (id: string, body: Record<string, unknown>) =>
    api.put<Record<string, unknown>>(hrPath(`/payroll/records/${id}`), body),
  verifyRecord: (id: string, changedBy?: string) =>
    api.post(hrPath(`/payroll/records/${id}/verify`), { changedBy }),
  verifyBatch: (body: { month?: number; year?: number; recordIds?: string[]; changedBy?: string }) =>
    api.post<Record<string, unknown>>(hrPath("/payroll/records/verify-batch"), body),
  approveRecord: (id: string, changedBy?: string) =>
    api.post(hrPath(`/payroll/records/${id}/approve`), { changedBy }),
  approveBatch: (body: { month?: number; year?: number; recordIds?: string[]; changedBy?: string }) =>
    api.post<Record<string, unknown>>(hrPath("/payroll/records/approve-batch"), body),
  unlockRecord: (id: string, reason: string, changedBy?: string) =>
    api.post(hrPath(`/payroll/records/${id}/unlock`), { reason, changedBy }),
  listPayments: (id: string) =>
    api.get<Record<string, unknown>[]>(hrPath(`/payroll/records/${id}/payments`)),
  recordPayment: (
    id: string,
    body: {
      amount: number;
      paymentDate: string;
      paymentMode: string;
      transactionReference: string;
      status: string;
      remarks?: string;
      recordedBy?: string;
    },
  ) => api.post(hrPath(`/payroll/records/${id}/payments`), body),
  listAuditLogs: () => api.get<Record<string, unknown>[]>(hrPath("/payroll/audit-logs")),
};

export const hrDepartmentService = crud<Record<string, unknown>>("/masters/departments");
export const hrDesignationService = crud<Record<string, unknown>>("/masters/designations");
export const hrEmploymentTypeService = crud<Record<string, unknown>>("/masters/employment-types");
export const hrShiftTypeService = crud<Record<string, unknown>>("/masters/shift-types");
export const hrLeaveTypeService = crud<Record<string, unknown>>("/masters/leave-types");
export const hrLeavePolicyService = crud<Record<string, unknown>>("/masters/leave-policies");
export const hrHolidayService = crud<Record<string, unknown>>("/masters/holidays");
export const hrSalaryComponentService = crud<Record<string, unknown>>("/masters/salary-components");
export const hrDocumentCategoryService = crud<Record<string, unknown>>("/masters/document-categories");
export const hrDocumentTypeService = crud<Record<string, unknown>>("/masters/document-types");
export const hrAttendanceService = {
  list: (query = "") => api.get<Record<string, unknown>[]>(hrPath(`/attendance${query}`)),
  listRange: (fromDate: string, toDate: string) =>
    api.get<Record<string, unknown>[]>(
      hrPath(
        `/attendance?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`,
      ),
    ),
  getDaily: (date: string) =>
    api.get<Record<string, unknown>[]>(hrPath(`/attendance/daily?date=${encodeURIComponent(date)}`)),
  getForEmployee: (employeeId: string) =>
    api.get<Record<string, unknown>[]>(hrPath(`/attendance/employee/${employeeId}`)),
  get: (id: string) => api.get<Record<string, unknown>>(hrPath(`/attendance/${id}`)),
  punchIn: (body: {
    employeeId: string;
    attendanceDate?: string;
    punchInAt?: string;
    source?: string;
    remarks?: string;
    changedBy?: string;
  }) => api.post<Record<string, unknown>>(hrPath("/attendance/punch-in"), body),
  punchOut: (body: {
    employeeId: string;
    attendanceDate?: string;
    punchOutAt?: string;
    source?: string;
    remarks?: string;
    changedBy?: string;
  }) => api.post<Record<string, unknown>>(hrPath("/attendance/punch-out"), body),
  correct: (
    id: string,
    body: {
      punchIn?: string | null;
      punchOut?: string | null;
      attendanceStatus?: string;
      remarks?: string;
      overrideReason: string;
      changedBy?: string;
    },
  ) => api.post<Record<string, unknown>>(hrPath(`/attendance/${id}/correct`), body),
  recalculate: (id: string) =>
    api.post<Record<string, unknown>>(hrPath(`/attendance/${id}/recalculate`), {}),
  processAbsence: (body?: { attendanceDate?: string }) =>
    api.post<Record<string, unknown>>(hrPath("/attendance/process-absence"), body ?? {}),
  create: (body: Record<string, unknown>) => api.post(hrPath("/attendance"), body),
  update: (id: string, body: Record<string, unknown>) => api.put(hrPath(`/attendance/${id}`), body),
  remove: (id: string) => api.delete<{ id: string }>(hrPath(`/attendance/${id}`)),
};
export const hrShiftAssignmentService = crud<Record<string, unknown>>("/shift-assignments");
export const hrWeeklyOffService = {
  ...crud<Record<string, unknown>>("/weekly-offs"),
  staffingPreview: (params: {
    day: string;
    effectiveFrom: string;
    effectiveTo: string;
    department?: string;
    excludeEmployeeId?: string;
  }) => {
    const q = new URLSearchParams({
      day: params.day,
      effectiveFrom: params.effectiveFrom,
      effectiveTo: params.effectiveTo,
    });
    if (params.department && params.department !== "ALL") {
      q.set("department", params.department);
    }
    if (params.excludeEmployeeId) {
      q.set("excludeEmployeeId", params.excludeEmployeeId);
    }
    return api.get<{
      day: string;
      effectiveFrom: string;
      effectiveTo: string;
      total: number;
      departmentCounts: Record<string, number>;
      employees: Array<{
        employeeId: string;
        employeeName: string;
        department: string;
        designation: string;
        assignmentId: string;
        effectiveFrom: string;
        effectiveTo: string | null;
      }>;
    }>(hrPath(`/weekly-offs/staffing-preview?${q}`));
  },
};
export const hrLeaveApplicationService = {
  ...crud<Record<string, unknown>>("/leave-applications"),
  previewDays: (body: {
    employeeId: string;
    fromDate: string;
    toDate: string;
    durationOption?: string;
  }) => api.post<Record<string, unknown>>(hrPath("/leave-applications/preview-days"), body),
  approve: (id: string, approvedBy?: string) =>
    api.post<Record<string, unknown>>(hrPath(`/leave-applications/${id}/approve`), { approvedBy }),
  cancel: (id: string, body?: { changedBy?: string; newToDate?: string }) =>
    api.post<Record<string, unknown>>(hrPath(`/leave-applications/${id}/cancel`), body ?? {}),
  modify: (
    id: string,
    body: { fromDate: string; toDate: string; changedBy?: string; durationOption?: string },
  ) => api.post<Record<string, unknown>>(hrPath(`/leave-applications/${id}/modify`), body),
};
export const hrOvertimeService = crud<Record<string, unknown>>("/overtime");
export const hrSalaryStructureService = crud<Record<string, unknown>>("/salary-structures");
export const hrPayslipService = {
  ...crud<Record<string, unknown>>("/payslips"),
  send: (id: string, sentBy?: string) =>
    api.post<Record<string, unknown>>(hrPath(`/payslips/${id}/send`), { sentBy }),
  sendBatch: (body: { month?: number; year?: number; payslipIds?: string[]; sentBy?: string }) =>
    api.post<Record<string, unknown>>(hrPath("/payslips/send-batch"), body),
};
export const hrComplaintCategoryService = crud<Record<string, unknown>>("/complaint-categories");
export const hrComplaintService = crud<Record<string, unknown>>("/complaints");

export const hrPayrollSettingsService = {
  list: () => api.get<Record<string, unknown>[]>(hrPath("/payroll/settings")),
  update: (id: string, body: Record<string, unknown>) =>
    api.put(hrPath(`/payroll/settings/${id}`), body),
};
