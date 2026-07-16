
import { ProductResponseDto, PurchasedStatus } from '@pms/types';


export interface PurchaseResponseDto {
  id: number;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  supplierName: string | null;
  totalAmount: number;
  notes: string | null;
  storeCode: string;
  userId: string;
  status: PurchasedStatus;
  purchaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: { name: string; email: string };
  items?: PurchaseItemResponseDto[];
}

export interface PurchaseItemResponseDto {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: number;
  costPrice: number;
  totalPrice: number;
  product?: ProductResponseDto;
}
