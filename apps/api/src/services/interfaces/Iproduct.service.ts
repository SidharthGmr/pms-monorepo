import { CreateProductDto, ProductResponseDto } from "../../dtos/product.dto";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ProductFilterParams } from "../../params/product.params";
import { CreateProductModel } from "../../models/product.model";

export interface IProductService {
  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  getBySlug(slug: string): Promise<ProductResponseDto | null>;
  getLowStockProducts(storeCode: string, page?: number, limit?: number): Promise<ListResponseDto<ProductResponseDto>>;
  create(data: CreateProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: CreateProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  addStock(id: number, quantity: number, userId: string, storeCode: string, reason?: string): Promise<ProductResponseDto>;
  getStockHistory(productId: number, storeCode: string, page?: number, limit?: number): Promise<any>;
  delete(id: number): Promise<ProductResponseDto>;
}
