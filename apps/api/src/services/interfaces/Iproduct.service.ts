import { ListResponseDto, ProductModel, ProductResponseDto, LowStockItemDto, ProductFilterParams } from '@pms/types';
export interface IProductService {

  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  getLowStock(storeCode: string, limit?: number): Promise<ListResponseDto<LowStockItemDto>>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;



}
