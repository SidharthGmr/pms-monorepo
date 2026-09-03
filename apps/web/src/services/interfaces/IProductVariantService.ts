import { AxiosResponse } from 'axios';
import { ProductVariantDto } from '@/dtos/product-variant.dto';
import { ProductVariantListItemDto, ProductVariantModel, ProductVariantListItemDto as VariantDetailDto } from '@pms/types';
import { RateProductVariantModel, VariantRatingDto } from '@/models/product-variant.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import Response from '@/dtos/Response';

export default interface IProductVariantService {
    create(model: ProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;
    update(id: number, model: ProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;


    getById(id: number | string): Promise<AxiosResponse<Response<VariantDetailDto>>>;

    rate(id: number, model: RateProductVariantModel): Promise<AxiosResponse<Response<VariantRatingDto>>>;


    /** The store-wide SKU list, across every product. */
    getAll(params?: ProductVariantFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>>;

    /** Public storefront listing: active variants of published products, no auth required. */
    getAllPublic(params?: ProductVariantFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>>;

    /** Paginated variant history for a product, newest first. */
    getByProductId(
        productId: number | string,
        params?: { page?: number; recordPerPage?: number }
    ): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantDto>>>>;

    /** The variant effective on a given date (defaults to now). */
    getEffective(productId: number | string, date?: string): Promise<AxiosResponse<Response<ProductVariantDto>>>;
}
