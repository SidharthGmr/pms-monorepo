export interface CreateStaffSalaryModel {
  staffId: number;
  month: number;
  year: number;
  baseSalary: number;
  attendanceBonus?: number;
  deductions?: number;
  advanceDeduction?: number;
  netPayable: number;
  paidAmount?: number;
  status?: string;
  paymentDate?: string;
  remarks?: string;
  processedBy?: number;
}

export interface UpdateStaffSalaryModel {
  baseSalary?: number;
  attendanceBonus?: number;
  deductions?: number;
  advanceDeduction?: number;
  netPayable?: number;
  paidAmount?: number;
  status?: string;
  paymentDate?: string;
  remarks?: string;
  processedBy?: number;
}
