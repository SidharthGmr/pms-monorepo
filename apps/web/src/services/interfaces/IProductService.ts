import { AxiosResponse } from 'axios';



import { CustomResponse as Response, ListResponseDto, ProductResponseDto, CreateProductModel, UpdateProductModel, ProductFilterParams } from '@pms/types';
export interface AddStockModel {
    /**
     * Which variant receives the stock. Stock is held per variant - Small and Large keep
     * their own counts - so a movement must say which one it belongs to.
     */
    variantId: number;
    quantity: number;
    reason?: string;
    /** Optional price change for the same variant, appended to its PriceHistory ledger. */
    sellingPrice?: number;
    costPrice?: number | null;
}

export default interface IProductService {
    create(model: CreateProductModel): Promise<AxiosResponse<Response<ProductResponseDto>>>;
    getAll(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductResponseDto>>>>;
    getAllPublic(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductResponseDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<ProductResponseDto>>>;
    update(id: number | string, model: UpdateProductModel): Promise<AxiosResponse<Response<ProductResponseDto>>>;
    getLowStock(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductResponseDto>>>>;
    addStock(id: number | string, model: AddStockModel): Promise<AxiosResponse<Response<ProductResponseDto>>>;
    /** Pass `variantId` to narrow the movements to a single variant. */
    getStockHistory(id: number | string, params?: { page?: number, recordPerPage?: number, variantId?: number }): Promise<AxiosResponse<Response<ListResponseDto<any>>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
