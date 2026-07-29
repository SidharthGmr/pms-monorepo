import { ListResponseDto, ProductModel, ProductResponseDto, ProductWithPriceResponseDto } from "@pms/types";
import { ProductFilterParams } from "../../params/product.params";

export interface AddStockModel {
  /**
   * Which variant receives the stock. Stock is held per variant - Small and Large have
   * their own counts - so a movement has to say which one it belongs to.
   */
  variantId: number;
  quantity: number;
  reason?: string | undefined;
  /** Optional price change applied to the same variant, filed in the PriceHistory ledger. */
  sellingPrice?: number | undefined;
  costPrice?: number | null | undefined;
}

export interface IProductService {
  getAll(filters?: ProductFilterParams): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  getLowStock(filters?: ProductFilterParams): Promise<ListResponseDto<ProductWithPriceResponseDto>>;
  getById(id: number): Promise<ProductResponseDto | null>;
  create(data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  update(id: number, data: ProductModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  delete(id: number): Promise<ProductResponseDto>;
  addStock(id: number, data: AddStockModel, userId: string, storeCode: string): Promise<ProductResponseDto>;
  /** Pass `variantId` to narrow the movements to a single variant. */
  getStockHistory(id: number, page?: number, limit?: number, variantId?: number): Promise<ListResponseDto<any>>;
}
