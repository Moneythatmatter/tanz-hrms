"use client";

import { formatMoney, formatMoneyCompactTotal, CURRENCY_AMOUNT_LABEL } from "@/lib/currency";
import {
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  Heart,
  Save,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui";

export interface EmployeeFormPreviewData {
  empCode: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  personalEmail: string;
  department: string;
  designation: string;
  reportingManager: string;
  employmentType: string;
  joinDate: string;
  workLocation: string;
  status: string;
  shiftType: string;
  weeklyOffPattern: string;
  leavePolicy: string;
  salaryStructure: string;
  salaryStructureName?: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  panNumber: string;
  uanNumber: string;
  esicNumber: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  enableSystemAccess: boolean;
  username: string;
  userRole: string;
  documents: { type: string; fileName: string }[];
  salaryBreakdown: {
    basic: number;
    hra: number;
    specialAllowance: number;
    gross: number;
    pfDeduction: number;
    esicDeduction: number;
    net: number;
  };
}

interface AddEmployeePreviewModalProps {
  open: boolean;
  data: EmployeeFormPreviewData | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function PreviewSection({
  title,
  icon,
  iconClassName,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconClassName: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClassName}`}>
          {icon}
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800">{title}</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{value || "—"}</p>
    </div>
  );
}

function displayValue(value: string) {
  return value.trim() || "—";
}

export function AddEmployeePreviewModal({
  open,
  data,
  isSubmitting,
  onClose,
  onConfirm,
}: AddEmployeePreviewModalProps) {
  if (!data) return null;

  const fullName = `${data.firstName} ${data.lastName}`.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Review Employee Details"
      description="Verify all information before saving the employee profile."
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Back to Edit
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Saving..." : "Confirm & Save Employee"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-medium text-emerald-800">Employee preview</p>
          <p className="mt-1 text-lg font-bold text-emerald-950">{fullName}</p>
          <p className="text-sm text-emerald-800">
            {data.empCode} · {displayValue(data.designation)} · {displayValue(data.department)}
          </p>
        </div>

        <PreviewSection
          title="Basic Information"
          icon={<User className="h-3.5 w-3.5" />}
          iconClassName="bg-emerald-100 text-emerald-800"
        >
          <PreviewField label="Employee ID" value={data.empCode} />
          <PreviewField label="Gender" value={data.gender} />
          <PreviewField label="Date of Birth" value={displayValue(data.dob)} />
          <PreviewField label="Mobile Number" value={displayValue(data.phone)} />
          <PreviewField label="Personal Email" value={displayValue(data.personalEmail)} />
        </PreviewSection>

        <PreviewSection
          title="Employment Information"
          icon={<Briefcase className="h-3.5 w-3.5" />}
          iconClassName="bg-blue-100 text-blue-800"
        >
          <PreviewField label="Department" value={displayValue(data.department)} />
          <PreviewField label="Designation" value={displayValue(data.designation)} />
          <PreviewField label="Reporting Manager" value={displayValue(data.reportingManager)} />
          <PreviewField label="Employment Type" value={displayValue(data.employmentType)} />
          <PreviewField label="Joining Date" value={displayValue(data.joinDate)} />
          <PreviewField label="Work Location" value={displayValue(data.workLocation)} />
          <PreviewField label="Status" value={data.status} />
        </PreviewSection>

        <PreviewSection
          title="Attendance & Leave"
          icon={<Clock className="h-3.5 w-3.5" />}
          iconClassName="bg-purple-100 text-purple-800"
        >
          <PreviewField label="Shift Type" value={displayValue(data.shiftType)} />
          <PreviewField label="Weekly Off" value={displayValue(data.weeklyOffPattern)} />
          <PreviewField label="Leave Policy" value={displayValue(data.leavePolicy)} />
        </PreviewSection>

        <PreviewSection
          title="Payroll Information"
          icon={<CreditCard className="h-3.5 w-3.5" />}
          iconClassName="bg-amber-100 text-amber-800"
        >
          <PreviewField label="Salary Structure" value={displayValue(data.salaryStructureName ?? data.salaryStructure)} />
          <PreviewField label="Gross Salary" value={formatMoney(data.salaryBreakdown.gross)} />
          <PreviewField label="Net Salary" value={formatMoney(data.salaryBreakdown.net)} />
          <PreviewField label="Bank Name" value={displayValue(data.bankName)} />
          <PreviewField label="Account Holder" value={displayValue(data.accountHolderName)} />
          <PreviewField label="Account Number" value={displayValue(data.accountNumber)} />
          <PreviewField label="IFSC Code" value={displayValue(data.ifscCode)} />
          <PreviewField label="PAN Number" value={displayValue(data.panNumber)} />
          <PreviewField label="UAN Number" value={displayValue(data.uanNumber)} />
          <PreviewField label="ESIC Number" value={displayValue(data.esicNumber)} />
        </PreviewSection>

        <PreviewSection
          title="Emergency Contact"
          icon={<Heart className="h-3.5 w-3.5" />}
          iconClassName="bg-rose-100 text-rose-800"
        >
          <PreviewField label="Contact Name" value={displayValue(data.emergencyName)} />
          <PreviewField label="Relationship" value={displayValue(data.emergencyRelation)} />
          <PreviewField label="Mobile Number" value={displayValue(data.emergencyPhone)} />
        </PreviewSection>

        {data.documents.length > 0 && (
          <PreviewSection
            title="Documents"
            icon={<FileText className="h-3.5 w-3.5" />}
            iconClassName="bg-teal-100 text-teal-800"
          >
            {data.documents.map((document) => (
              <PreviewField
                key={`${document.type}-${document.fileName}`}
                label={document.type}
                value={document.fileName}
              />
            ))}
          </PreviewSection>
        )}

        {data.enableSystemAccess && (
          <PreviewSection
            title="System Access"
            icon={<User className="h-3.5 w-3.5" />}
            iconClassName="bg-slate-200 text-slate-800"
          >
            <PreviewField label="Username" value={displayValue(data.username)} />
            <PreviewField label="User Role" value={displayValue(data.userRole)} />
            <PreviewField label="Password" value="••••••••" />
          </PreviewSection>
        )}
      </div>
    </Modal>
  );
}
