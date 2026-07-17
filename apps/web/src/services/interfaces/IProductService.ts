import { AxiosResponse } from 'axios';
import { ProductDto } from '@/dtos/product.dto';
import { CreateProductModel, UpdateProductModel } from '@/models/product.model';
import { ProductFilterParams } from '@/params/product.params';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';

export interface AddStockModel {
    quantity: number;
    reason?: string;
    sellingPrice?: number;
    costPrice?: number | null;
}

export default interface IProductService {
    create(model: CreateProductModel): Promise<AxiosResponse<Response<ProductDto>>>;
    getAll(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<ProductDto>>>;
    update(id: number | string, model: UpdateProductModel): Promise<AxiosResponse<Response<ProductDto>>>;
    getLowStock(params?: ProductFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductDto>>>>;
    addStock(id: number | string, model: AddStockModel): Promise<AxiosResponse<Response<ProductDto>>>;
    getStockHistory(id: number | string, params?: { page?: number, recordPerPage?: number }): Promise<AxiosResponse<Response<ListResponseDto<any>>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
