export interface PageFilterParams {
    search?: string;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    recordPerPage?: number;
    showAllRecords?: boolean;
}

export interface ProductFilterParams extends PageFilterParams {
    categoryId?: string | null;
    status?: string | null;
    storeCode?: string | null;
}

export interface ProductAttributeFilterParams extends PageFilterParams {
    productId?: number | null;
}
