import { AxiosResponse } from 'axios';

import { CustomResponse as Response, ListResponseDto, ProductVariantCreateRequest, ProductVariantListItemDto, ProductVariantUpdateRequest, ProductVariantResponseDto, RateProductVariantModel, VariantRatingDto, ProductVariantFilterParams, ProductVariantListItemDto as VariantDetailDto } from '@pms/types';
export default interface IProductVariantService {
  create(model: ProductVariantCreateRequest): Promise<AxiosResponse<Response<ProductVariantResponseDto>>>;
  update(id: number, model: ProductVariantUpdateRequest): Promise<AxiosResponse<Response<ProductVariantResponseDto>>>;

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
  ): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantResponseDto>>>>;

  /** The variant effective on a given date (defaults to now). */
  getEffective(productId: number | string, date?: string): Promise<AxiosResponse<Response<ProductVariantResponseDto>>>;
}
