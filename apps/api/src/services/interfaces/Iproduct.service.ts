import { ListResponseDto, ProductDetailResponseDto, ProductModel, ProductResponseDto, ProductWithPriceResponseDto } from "@pms/types";
import { ProductFilterParams } from "../../params/product.params";

export interface AddStockModel {
  variantId: number;
  quantity: number;
  reason?: string | undefined;
  sellingPrice?: number | undefined;
  costPrice?: number | null | undefined;
}

export interface IProductService {
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductResponseDto>>;
  getById(id: number): Promise<ProductDetailResponseDto | null>;
  update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  delete(id: number, userId: string): Promise<ProductResponseDto>;



  getLowStock(filters?: ProductFilterParams): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  addStock(id: number, data: AddStockModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  getStockHistory(id: number, page?: number, limit?: number, variantId?: number): Promise<ListResponseDto<any>>;
}
