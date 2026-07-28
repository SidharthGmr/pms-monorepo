export interface PurchaseFilterParams {
  page?: number;
  recordPerPage?: number;
  search?: string;
  /** Sent as ISO strings — they travel to the API as query-string values. */
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: string;
}
