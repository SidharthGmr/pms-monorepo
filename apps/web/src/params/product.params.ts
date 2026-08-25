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
    brandNameId?: string | null;
    status?: string | null;
    storeCode?: string | null;
    /** Only real columns are honoured by the API; price and stock are derived, not stored. */
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
}

export interface ProductAttributeFilterParams extends PageFilterParams {
    productId?: number | null;
}
