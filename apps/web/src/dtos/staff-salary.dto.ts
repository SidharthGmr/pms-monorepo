import { PaymentStatus } from '@/enums/payment-status.enum';

export interface StaffSalaryDto {
    id: number;
    staffId: number;
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
