export interface CreatePurchaseItemModel {
    /** Stock is received against a specific variant, so the caller has to name it. */
    variantId: number;
    quantity: number;
    costPrice: number;
    totalPrice: number;
}

export interface CreatePurchaseModel {
    invoiceNumber?: string;
    invoiceUrl?: string;
    supplierId?: string;
    supplierName?: string;
    totalAmount: number;
    notes?: string;
    purchaseDate?: string;
    items: CreatePurchaseItemModel[];
}
