import { AxiosResponse } from 'axios';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { CreateProductVariantModel } from '@/models/product-variant.model';
import Response from '@/dtos/Response';

export default interface IProductVariantService {
    create(model: CreateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;
    getAll(): Promise<AxiosResponse<Response<ProductVariantDto[]>>>;
    getByProductId(productId: number | string): Promise<AxiosResponse<Response<ProductVariantDto[]>>>;
    getById(id: number | string): Promise<AxiosResponse<Response<ProductVariantDto>>>;
    update(id: number | string, model: CreateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;
    delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
