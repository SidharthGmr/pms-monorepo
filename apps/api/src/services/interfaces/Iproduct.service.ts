import { ListResponseDto, ProductModel, ProductResponseDto } from "@pms/types";
import { LowStockItemDto } from "../../dtos/low-stock.dto";
import { ProductFilterParams } from "../../params/product.params";

export interface IProductService {

  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  getLowStock(storeCode: string, limit?: number): Promise<ListResponseDto<LowStockItemDto>>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;



}
