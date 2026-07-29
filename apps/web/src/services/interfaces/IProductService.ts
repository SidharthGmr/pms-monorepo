import { AxiosResponse } from 'axios';
import { ProductDto } from '@/dtos/product.dto';
import { CreateProductModel, UpdateProductModel } from '@/models/product.model';
import { ProductFilterParams } from '@/params/product.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

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
    create(model: CreateProductModel): Promise<AxiosResponse<Response<ProductDto>>>;
    getAll(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>>;
    getAllPublic(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<ProductDto>>>;
    update(id: number | string, model: UpdateProductModel): Promise<AxiosResponse<Response<ProductDto>>>;
    getLowStock(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>>;
    addStock(id: number | string, model: AddStockModel): Promise<AxiosResponse<Response<ProductDto>>>;
    /** Pass `variantId` to narrow the movements to a single variant. */
    getStockHistory(id: number | string, params?: { page?: number, recordPerPage?: number, variantId?: number }): Promise<AxiosResponse<Response<ListResponseDto<any>>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
