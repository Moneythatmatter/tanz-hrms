export interface HRKpiSummary {
  totalEmployees: number;
  newJoineesThisMonth: number;
  presentCount: number;
  totalShiftStaff: number;
  attendanceRate: number;
  onLeaveCount: number;
  pendingLeaveRequestsCount: number;
  payrollProcessedCount: number;
  payrollPendingCount: number;
  payCycleDate: string;
}

export interface AttendanceBreakdown {
  present: number;
  absent: number;
  onLeave: number;
  lateArrivals: number;
}

export interface DepartmentHeadcount {
  department: string;
  count: number;
  color: string;
}

export interface PendingLeaveItem {
  id: string;
  employeeName: string;
  avatar: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
}

export interface HRActivityItem {
  id: string;
  type: "join" | "leave" | "attendance" | "payroll" | "grievance";
  title: string;
  description: string;
  timeAgo: string;
}

export interface EmployeeEventItem {
  id: string;
  name: string;
  avatar: string;
  department: string;
  type: "birthday" | "anniversary";
  date: string;
  years?: number;
}

export interface HolidayShiftItem {
  id: string;
  title: string;
  date: string;
  type: "holiday" | "shift_exception";
  badgeText: string;
}

export interface GrievanceSummary {
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
}

export const sampleHRKpiSummary: HRKpiSummary = {
  totalEmployees: 0,
  newJoineesThisMonth: 0,
  presentCount: 0,
  totalShiftStaff: 0,
  attendanceRate: 0,
  onLeaveCount: 0,
  pendingLeaveRequestsCount: 0,
  payrollProcessedCount: 0,
  payrollPendingCount: 0,
  payCycleDate: "—",
};

export const sampleAttendanceBreakdown: AttendanceBreakdown = {
  present: 0,
  absent: 0,
  onLeave: 0,
  lateArrivals: 0,
};

export interface HRWeeklyAttendancePoint {
  day: string;
  present: number;
}

export const sampleWeeklyAttendanceTrend: HRWeeklyAttendancePoint[] = [];

export const departmentChartColors: Record<string, string> = {
  Housekeeping: "#16a34a",
  "Food & Beverage": "#f59e0b",
  "F&B Service": "#2563eb",
  "Kitchen / Culinary": "#f59e0b",
  "Front Office": "#9333ea",
  "Human Resources": "#6366f1",
  Engineering: "#e11d48",
  "Maintenance & Eng.": "#e11d48",
  "HR & Admin": "#6366f1",
};

export const sampleDepartmentHeadcounts: DepartmentHeadcount[] = [];

export const samplePendingLeaves: PendingLeaveItem[] = [];

export const sampleHRActivities: HRActivityItem[] = [];

export const sampleEvents: EmployeeEventItem[] = [];

export const sampleHolidaysAndShifts: HolidayShiftItem[] = [];

export const sampleGrievances: GrievanceSummary = {
  open: 0,
  inProgress: 0,
  escalated: 0,
  resolved: 0,
};

export interface DesignationHeadcount {
  designation: string;
  department: string;
  count: number;
  color: string;
}

export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
  total: number;
}

export const sampleDesignationHeadcounts: DesignationHeadcount[] = [];

export const sampleGenderDistribution: GenderDistribution = {
  male: 0,
  female: 0,
  other: 0,
  total: 0,
};
