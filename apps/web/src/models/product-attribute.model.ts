export interface CreateAttributeModel {
    name: string;
    unit?: string;
}

export interface CreateProductAttributeModel {
    productId: number;
    attributeId: number;
    value: string;
}

export interface UpdateProductAttributeModel {
    attributeId?: number;
    value?: string;
}
