export interface CreatePurchaseItemModel {
    productId: number;
    quantity: number;
    costPrice: number;
    totalPrice: number;
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
