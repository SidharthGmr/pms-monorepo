export type PaymentDirection = 'IN' | 'OUT';

export enum PaymentDirectionEnum {
  In = 'IN',
  Out = 'OUT',
}

export const PAYMENT_DIRECTION_LABELS: Record<PaymentDirection, string> = {
  IN: 'Money In',
  OUT: 'Money Out',
};
