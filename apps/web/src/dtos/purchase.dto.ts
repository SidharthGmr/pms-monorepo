import { PurchaseStatus } from '@/enums/purchase-status.enum';
import { ProductDto } from './product.dto';

// Purchase list/detail endpoints include the full related product row
// (`items: { include: { product: true } }`), minus the price fields that
// live on productVariant. createdById/updatedById are redeclared because
// the API returns user UUIDs, not the numeric ids ProductDto claims.
export type PurchaseItemProductDto = Omit<ProductDto, 'price' | 'stock' | 'variants' | 'currentPrice' | 'createdById' | 'updatedById'> & {
  createdById: string;
  updatedById?: string | null;
  deletedAt?: Date | null;
};

export interface PurchaseItemDto {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: number;
  costPrice: number;
  totalPrice: number;
  product?: PurchaseItemProductDto;
}

export interface PurchaseDto {
  id: number;
  storeCode: string;
  userId: string;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  totalAmount: number;
  notes?: string | null;
  status: PurchaseStatus;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string | null;
  user?: {
    name: string;
    email: string;
  };
  items?: PurchaseItemDto[];
}
