import { z } from "zod";
import { numeric, optionalNumberField } from "./fields";

export const PaymentStatusValues = ["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"] as const;

const nonNegative = (label: string) => optionalNumberField(`${label} must be a number`).refine((value) => value === undefined || value >= 0, `${label} must be >= 0`);

export const staffSalaryFields = z.object({
  staffId: numeric(z.number({ error: "Staff ID must be a number" })),
  month: numeric(z.number({ error: "Month must be a number" }).min(1, "Month must be between 1-12").max(12, "Month must be between 1-12")),
  year: numeric(z.number({ error: "Year must be a number" }).min(2000, "Year must be >= 2000").max(2100, "Year must be <= 2100")),
  baseSalary: numeric(z.number({ error: "Base salary must be a number" }).min(0, "Base salary must be >= 0")),
  attendanceBonus: nonNegative("Attendance bonus"),
  deductions: nonNegative("Deductions"),
  advanceDeduction: nonNegative("Advance deduction"),
  netPayable: numeric(z.number({ error: "Net payable must be a number" }).min(0, "Net payable must be >= 0")),
  paidAmount: nonNegative("Paid amount"),
  status: z.enum(PaymentStatusValues).optional(),
  paymentDate: z.string().optional(),
  remarks: z.string().optional(),
  processedBy: optionalNumberField("Processed by must be a number"),
});

export const staffSalaryValidator = z.object({ body: staffSalaryFields });

export const updateStaffSalaryValidator = z.object({ body: staffSalaryFields.partial() });
