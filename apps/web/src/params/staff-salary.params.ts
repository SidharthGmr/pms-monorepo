export interface PageFilterParams {
    search?: string;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    recordPerPage?: number;
    showAllRecords?: boolean;
}

export interface StaffSalaryFilterParams extends PageFilterParams {
    staffId?: number | null;
    month?: number | null;
    year?: number | null;
    status?: string | null;
}
