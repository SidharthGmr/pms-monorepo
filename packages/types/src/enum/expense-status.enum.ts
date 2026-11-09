export type ExpenseStatus = "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";

export enum ExpenseStatusEnum {
  Draft = "DRAFT",
  Approved = "APPROVED",
  Paid = "PAID",
  Cancelled = "CANCELLED",
}

export type RecurrenceInterval = "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export enum RecurrenceIntervalEnum {
  Weekly = "WEEKLY",
  Monthly = "MONTHLY",
  Quarterly = "QUARTERLY",
  Yearly = "YEARLY",
}
