import { FinancialYearDto, ListResponseDto, PageFilterParams } from '@pms/types';

export interface IFinancialYearRepository {
  findAll(
    filters?: PageFilterParams,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ListResponseDto<FinancialYearDto>>;
  findById(id: number, storeCode: string): Promise<FinancialYearDto | null>;
  delete(id: number, storeCode: string): Promise<FinancialYearDto>;
  findOverlapping(storeCode: string, startDate: Date, endDate: Date, excludeId?: number): Promise<FinancialYearDto | null>;
}
