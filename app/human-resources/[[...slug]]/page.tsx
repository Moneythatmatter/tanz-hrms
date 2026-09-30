import { redirect } from "next/navigation";
import { HRBlankView } from "@/components/hr/HRBlankView";
import { HRDashboardView } from "@/components/hr/HRDashboardView";
import { EmployeeListView } from "@/components/hr/EmployeeListView";
import { AddEmployeeView } from "@/components/hr/AddEmployeeView";
import { EmployeeProfileView } from "@/components/hr/EmployeeProfileView";
import { DocumentMastersView } from "@/components/hr/DocumentMastersView";
import { ShiftManagementView } from "@/components/hr/ShiftManagementView";
import { LeaveManagementView } from "@/components/hr/LeaveManagementView";
import { OvertimeManagementView } from "@/components/hr/OvertimeManagementView";
import { WeeklyOffView } from "@/components/hr/WeeklyOffView";
import { AttendanceView } from "@/components/hr/AttendanceView";
import { SalaryStructureView } from "@/components/hr/SalaryStructureView";
import { PayrollSettingsView } from "@/components/hr/PayrollSettingsView";
import { ProcessPayrollView } from "@/components/hr/ProcessPayrollView";
import { CompensationIncrementsView } from "@/components/hr/CompensationIncrementsView";
import { PayslipsView } from "@/components/hr/PayslipsView";
import { ComplaintCategoriesView } from "@/components/hr/ComplaintCategoriesView";
import { RaiseComplaintView } from "@/components/hr/RaiseComplaintView";
import { ComplaintListView } from "@/components/hr/ComplaintListView";
import { ComplaintStatusView } from "@/components/hr/ComplaintStatusView";
import { DepartmentMasterView } from "@/components/hr/DepartmentMasterView";
import { DesignationMasterView } from "@/components/hr/DesignationMasterView";
import { EmploymentTypesMasterView } from "@/components/hr/EmploymentTypesMasterView";
import { ShiftTypesMasterView } from "@/components/hr/ShiftTypesMasterView";
import { LeaveTypesMasterView } from "@/components/hr/LeaveTypesMasterView";
import { LeavePolicyMasterView } from "@/components/hr/LeavePolicyMasterView";
import { HolidayCalendarMasterView } from "@/components/hr/HolidayCalendarMasterView";
import { SalaryComponentsMasterView } from "@/components/hr/SalaryComponentsMasterView";
import { HRReportsView } from "@/components/hr/HRReportsView";
import { HRMastersHubView } from "@/components/hr/HRMastersHubView";
import { UserManagementView } from "@/components/hr/UserManagementView";

export default async function HumanResourcesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugArray = resolvedParams.slug || [];
  const slugPath = slugArray.join("/");

  if (!slugPath || slugPath === "dashboard") {
    return <HRDashboardView />;
  }

  if (slugPath === "employees/list" || slugPath === "employees") {
    return <EmployeeListView />;
  }

  if (slugPath === "employees/add") {
    return <AddEmployeeView />;
  }

  if (slugPath === "employees/profile") {
    return <EmployeeProfileView initialEmpId={resolvedSearchParams.id} />;
  }

  if (slugPath === "employees/documents") {
    redirect("/human-resources/employees/list");
  }

  if (slugPath === "attendance-leave/attendance") {
    return <AttendanceView />;
  }

  if (slugPath === "attendance-leave/shift-management") {
    return <ShiftManagementView />;
  }

  if (slugPath === "attendance-leave/leave-management") {
    return <LeaveManagementView />;
  }

  if (slugPath === "attendance-leave/overtime") {
    return <OvertimeManagementView />;
  }

  if (slugPath === "attendance-leave/weekly-off") {
    return <WeeklyOffView />;
  }

  if (slugPath === "payroll/process-payroll") {
    return <ProcessPayrollView />;
  }

  if (slugPath === "payroll/increments" || slugPath === "payroll/compensation-revisions") {
    return <CompensationIncrementsView />;
  }

  if (slugPath === "payroll/salary-structure") {
    return <SalaryStructureView />;
  }

  if (slugPath === "payroll/payslips") {
    return <PayslipsView />;
  }

  if (slugPath === "payroll/tax-management") {
    redirect("/human-resources/payroll/process-payroll");
  }

  if (slugPath === "payroll/payroll-settings") {
    return <PayrollSettingsView />;
  }

  if (
    slugPath === "grievances/complaint-categories" ||
    slugPath === "grievances/categories" ||
    slugPath === "masters/complaint-categories"
  ) {
    return <ComplaintCategoriesView />;
  }

  if (
    slugPath === "grievances/raise-complaint" ||
    slugPath === "grievances/raise"
  ) {
    return <RaiseComplaintView />;
  }

  if (
    slugPath === "grievances/complaint-list" ||
    slugPath === "grievances/list"
  ) {
    return <ComplaintListView />;
  }

  if (
    slugPath === "grievances/complaint-status" ||
    slugPath === "grievances/status" ||
    slugPath === "grievances"
  ) {
    return <ComplaintStatusView />;
  }

  if (slugPath === "masters") {
    return <HRMastersHubView />;
  }

  if (
    slugPath === "masters/departments" ||
    slugPath === "masters/department" ||
    slugPath === "departments"
  ) {
    return <DepartmentMasterView />;
  }

  if (
    slugPath === "masters/designations" ||
    slugPath === "masters/designation" ||
    slugPath === "designations"
  ) {
    return <DesignationMasterView />;
  }

  if (
    slugPath === "masters/employment-types" ||
    slugPath === "masters/employment-type" ||
    slugPath === "employment-types"
  ) {
    return <EmploymentTypesMasterView />;
  }

  if (
    slugPath === "masters/shift-types" ||
    slugPath === "masters/shift-type" ||
    slugPath === "shift-types"
  ) {
    return <ShiftTypesMasterView />;
  }

  if (
    slugPath === "masters/leave-types" ||
    slugPath === "masters/leave-type" ||
    slugPath === "leave-types"
  ) {
    return <LeaveTypesMasterView />;
  }

  if (
    slugPath === "masters/leave-policies" ||
    slugPath === "masters/leave-policy" ||
    slugPath === "leave-policies"
  ) {
    return <LeavePolicyMasterView />;
  }

  if (
    slugPath === "masters/holiday-calendar" ||
    slugPath === "masters/holidays" ||
    slugPath === "holiday-calendar"
  ) {
    return <HolidayCalendarMasterView />;
  }

  if (
    slugPath === "masters/salary-components" ||
    slugPath === "masters/salary-component" ||
    slugPath === "salary-components"
  ) {
    return <SalaryComponentsMasterView />;
  }

  if (
    slugPath === "masters/document-masters" ||
    slugPath === "masters/documents"
  ) {
    return <DocumentMastersView />;
  }

  if (slugPath === "reports") {
    return <HRReportsView />;
  }

  if (slugPath === "settings/users" || slugPath === "users") {
    return <UserManagementView />;
  }

  return <HRBlankView slugPath={slugPath} />;
}
