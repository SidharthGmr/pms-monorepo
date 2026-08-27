import { AxiosResponse } from 'axios';
import { ProductVariantDto, ProductVariantListItemDto } from '@/dtos/product-variant.dto';
// The single-variant read is typed from the shared package: the local ProductVariantListItemDto
// above still declares columns the API no longer returns (effectiveFrom, storeCode, productId).
import { ProductVariantListItemDto as VariantDetailDto } from '@pms/types';
import { CreateProductVariantModel, UpdateProductVariantModel } from '@/models/product-variant.model';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { ProductVariantFilterParams } from '@/params/product-variant.params';
import Response from '@/dtos/Response';

export default interface IProductVariantService {
    /** One variant with its parent product, for the edit screen. Store-scoped by the API. */
    getById(id: number | string): Promise<AxiosResponse<Response<VariantDetailDto>>>;

    /** Records a new variant; the previously active one is deactivated by the API. */
    create(model: CreateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;

    /** Updates a variant's safe fields (name, sku, barcode, threshold, active flag). */
    update(id: number, model: UpdateProductVariantModel): Promise<AxiosResponse<Response<ProductVariantDto>>>;

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
