import { ListResponseDto, TaxDto, TaxFilterParams, TaxModel } from '@pms/types';

export interface ITaxService {
  create(data: TaxModel): Promise<TaxDto>;
  getAll(filters?: TaxFilterParams): Promise<ListResponseDto<TaxDto>>;
  getById(id: string): Promise<TaxDto | null>;
  update(id: string, data: TaxModel): Promise<TaxDto>;
  delete(id: string): Promise<TaxDto>;
}
