import { ProductModel, ProductResponseDto } from "@pms/types";
import { ListResponseDto } from "../../dtos/list-response.dto";
import { ProductFilterParams } from "../../params/product.params";
import { CreateProductModel } from "../../models/product.model";

export interface IProductService {
  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: CreateProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  delete(id: number): Promise<ProductResponseDto>;
}
