import { ListResponseDto, TaxDto, TaxFilterParams } from '@pms/types';

export interface ITaxRepository {
  findAll(filters?: TaxFilterParams, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<ListResponseDto<TaxDto>>;
  findById(id: string): Promise<TaxDto | null>;
  delete(id: string): Promise<TaxDto>;
}
