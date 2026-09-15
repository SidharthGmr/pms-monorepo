import { CreateBrandModel } from '@pms/types';
import { BrandNameDto } from '../../dtos/brand-name.dto';
import { ListResponseDto } from '../../dtos/list-response.dto';
import { BrandNameFilterParams } from '../../params/brand-name.params';

export interface IBrandNameService {
  create(data: CreateBrandModel, storeCode: string): Promise<BrandNameDto>;
  getAll(filters?: BrandNameFilterParams): Promise<ListResponseDto<BrandNameDto>>;
  getById(id: number, storeCode: string): Promise<BrandNameDto>;
  update(id: number, data: CreateBrandModel, storeCode: string): Promise<BrandNameDto>;
  delete(id: number, storeCode: string): Promise<BrandNameDto>;
}
