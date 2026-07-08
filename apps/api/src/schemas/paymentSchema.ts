import { z } from "zod";

const PaymentMethodEnum = z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "ONLINE"]);
const PaymentStatusEnum = z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]);

export const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.number().int().positive("Order ID is required"),
    amount: z.number().positive("Amount must be > 0"),
    method: PaymentMethodEnum,
    status: PaymentStatusEnum.optional(),
    transactionId: z.string().optional(),
    paymentDate: z.string().optional(),
    remarks: z.string().optional(),
  }),
});

export const updatePaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive().optional(),
    method: PaymentMethodEnum.optional(),
    status: PaymentStatusEnum.optional(),
    transactionId: z.string().optional(),
    remarks: z.string().optional(),
  }),
});
