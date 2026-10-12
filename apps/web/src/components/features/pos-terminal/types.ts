export interface PosCartLine {
  variantId: number;
  name: string;
  sku: string;
  image: string | null;
  unitPrice: number;
  stock: number;
  quantity: number;
}

export interface HeldOrder {
  id: string;
  label: string;
  heldAt: string;
  lines: PosCartLine[];
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD';
