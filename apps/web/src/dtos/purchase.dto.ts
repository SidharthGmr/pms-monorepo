export interface PurchaseItemDto {
  id: number;
  purchaseId: number;
  productId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface PurchaseDto {
  id: number;
  storeCode: string;
  userId: number;
  invoiceNumber?: string;
  invoiceUrl?: string;
  supplierName?: string;
  totalAmount: number;
  notes?: string;
  purchaseDate: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
  };
  items?: PurchaseItemDto[];
}
