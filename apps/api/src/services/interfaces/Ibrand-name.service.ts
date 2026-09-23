import { BrandNameDto, BrandNameFilterParams, CreateBrandNameModel } from '@pms/types';
import { ListResponseDto } from '../../dtos/list-response.dto';

export interface IBrandNameService {
  create(data: CreateBrandNameModel, storeCode: string): Promise<BrandNameDto>;
  getAll(filters?: BrandNameFilterParams): Promise<ListResponseDto<BrandNameDto>>;
  getById(id: number, storeCode: string): Promise<BrandNameDto>;
  update(id: number, data: CreateBrandNameModel, storeCode: string): Promise<BrandNameDto>;
  delete(id: number, storeCode: string): Promise<BrandNameDto>;
}
