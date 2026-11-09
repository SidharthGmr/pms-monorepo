export interface FinancialYearDto {
  id: number;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  isClosed: boolean;
  closedAt: Date | string | null;
  closedById: string | null;
  /** How many posted vouchers fall inside the year, so the UI can warn before closing it. */
  entryCount?: number;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}
