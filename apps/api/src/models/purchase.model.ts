export interface CreatePurchaseItemModel {
  productId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface CreatePurchaseModel {
  invoiceNumber?: string;
  invoiceUrl?: string;
  supplierName?: string;
  totalAmount: number;
  notes?: string;
  purchaseDate?: string;
  items: CreatePurchaseItemModel[];
}
