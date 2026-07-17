import { ListResponseDto, ProductModel, ProductResponseDto, ProductWithPriceResponseDto } from "@pms/types";
import { ProductFilterParams } from "../../params/product.params";

export interface AddStockModel {
  quantity: number;
  reason?: string | undefined;
  sellingPrice?: number | undefined;
  costPrice?: number | null | undefined;
}

export interface IProductService {
  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  delete(id: number): Promise<ProductResponseDto>;
  addStock(id: number, data: AddStockModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  getStockHistory(id: number, page?: number, limit?: number): Promise<ListResponseDto<any>>;
}
