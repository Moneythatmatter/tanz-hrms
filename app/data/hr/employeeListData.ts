export interface EmployeeItem {
  id: string;
  empCode: string;
  name: string;
  avatar: string;
  photoUrl?: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employmentType: "Permanent" | "Contractual" | "Probation" | "Trainee";
  shiftType: "Morning Shift" | "Evening Shift" | "Night Shift" | "General Shift";
  joinDate: string;
  salaryStructureId?: string;
  salaryStructureName?: string;
  structureGrossSalary?: number;
  structureNetSalary?: number;
  status: "Active" | "On Leave" | "Inactive";
  gender: "Male" | "Female";
  emergencyContact: string;
  lastUpdated: string;

  // Extended Details for Tabbed Drawer
  dob?: string;
  address?: string;
  bloodGroup?: string;
  reportingManager?: string;
  attendanceRate?: number;
  leaveBalance?: { casual: number; sick: number; earned: number };
  bankAccount?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  uanNumber?: string;
  esicNumber?: string;
  documentsCount?: number;
  openGrievancesCount?: number;
}

export const sampleEmployees: EmployeeItem[] = [];
