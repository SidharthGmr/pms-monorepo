import { z } from "zod";

const PaymentStatusEnum = z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]);

export const createStaffSalarySchema = z.object({
  body: z.object({
    staffId: z.number().int().positive("Staff ID is required"),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000),
    baseSalary: z.number().nonnegative(),
    attendanceBonus: z.number().nonnegative().optional(),
    deductions: z.number().nonnegative().optional(),
    advanceDeduction: z.number().nonnegative().optional(),
    netPayable: z.number().nonnegative(),
    paidAmount: z.number().nonnegative().optional(),
    status: PaymentStatusEnum.optional(),
    paymentDate: z.string().optional(),
    remarks: z.string().optional(),
    processedBy: z.number().int().positive().optional(),
  }),
});

export const updateStaffSalarySchema = z.object({
  body: z.object({
    baseSalary: z.number().nonnegative().optional(),
    attendanceBonus: z.number().nonnegative().optional(),
    deductions: z.number().nonnegative().optional(),
    advanceDeduction: z.number().nonnegative().optional(),
    netPayable: z.number().nonnegative().optional(),
    paidAmount: z.number().nonnegative().optional(),
    status: PaymentStatusEnum.optional(),
    paymentDate: z.string().optional(),
    remarks: z.string().optional(),
    processedBy: z.number().int().positive().optional(),
  }),
});
