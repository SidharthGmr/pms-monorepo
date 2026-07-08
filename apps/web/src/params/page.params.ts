export interface PageFilterParams {
  search?: string;
  q?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  recordPerPage?: number;
   sortBy?: string;
  sortDirection?: string;
  showAllRecords?: boolean;
}
