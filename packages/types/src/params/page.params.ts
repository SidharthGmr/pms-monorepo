export interface PageFilterParams {
  search?: string;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  page?: number;
  recordPerPage?: number;
  showAllRecords?: boolean;
  storeCode?: string;
  sortBy?: string | null;
  sortDirection?: string | null;
}
