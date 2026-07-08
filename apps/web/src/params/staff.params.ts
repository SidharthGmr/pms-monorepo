 
export interface PageFilterParams {
    search?: string;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    recordPerPage?: number;
    showAllRecords?: boolean;
}
export interface StaffFilterParams extends PageFilterParams {
    storeId?: number;
    isActive?: boolean;
    department?: string;
    position?: string;
}
