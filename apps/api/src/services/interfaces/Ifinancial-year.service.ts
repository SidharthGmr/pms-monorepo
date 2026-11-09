import { FinancialYearDto, FinancialYearModel, ListResponseDto, PageFilterParams } from '@pms/types';

export interface IFinancialYearService {
  create(data: FinancialYearModel, storeCode: string): Promise<FinancialYearDto>;
  getAll(filters?: PageFilterParams): Promise<ListResponseDto<FinancialYearDto>>;
  getById(id: number, storeCode: string): Promise<FinancialYearDto | null>;
  update(id: number, data: FinancialYearModel, storeCode: string): Promise<FinancialYearDto>;
  delete(id: number, storeCode: string): Promise<FinancialYearDto>;
  setClosed(id: number, isClosed: boolean, storeCode: string, userId: string): Promise<FinancialYearDto>;
}
