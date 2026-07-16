import { ListResponseDto, ProductModel, ProductResponseDto, ProductWithPriceResponseDto } from "@pms/types";
import { ProductFilterParams } from "../../params/product.params";

export interface IProductService {
  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  delete(id: number): Promise<ProductResponseDto>;
}
