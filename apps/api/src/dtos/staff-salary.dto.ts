import { PaymentStatus } from "@prisma/client";

export interface StaffSalaryDto {
  id: number;
  staffId: number;
  storeCode: string
  month: number;
  year: number;
  baseSalary: number;
  attendanceBonus?: number | null;
  deductions?: number | null;
  advanceDeduction?: number | null;
  netPayable: number;
  paidAmount: number;
  status: PaymentStatus;
  paymentDate?: Date | null;
  remarks?: string | null;
  processedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffSalaryDto {
  staffId: number;
  storeCode: string
  month: number;
  year: number;
  baseSalary: number;
  attendanceBonus?: number | null;
  deductions?: number | null;
  advanceDeduction?: number | null;
  netPayable: number;
  paidAmount?: number;
  status?: PaymentStatus;
  paymentDate?: Date | null;
  remarks?: string | null;
  processedBy?: number | null;
}

export interface UpdateStaffSalaryDto {
  baseSalary?: number;
  attendanceBonus?: number | null;
  deductions?: number | null;
  advanceDeduction?: number | null;
  netPayable?: number;
  paidAmount?: number;
  status?: PaymentStatus;
  paymentDate?: Date | null;
  remarks?: string | null;
  processedBy?: number | null;
}
