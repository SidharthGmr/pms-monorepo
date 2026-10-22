export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export enum PaymentStatusEnum {
  Pending = 'PENDING',
  Partial = 'PARTIAL',
  Paid = 'PAID',
  Overdue = 'OVERDUE',
  Cancelled = 'CANCELLED',
}
