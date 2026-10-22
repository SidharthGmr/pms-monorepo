import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import IProductVariantService from './interfaces/IProductVariantService';

import { CustomResponse as Response, ListResponseDto, ProductVariantCreateRequest, ProductVariantListItemDto, ProductVariantUpdateRequest, ProductVariantResponseDto, RateProductVariantModel, VariantRatingDto, ProductVariantFilterParams, ProductVariantListItemDto as VariantDetailDto } from '@pms/types';
@injectable()
export default class ProductVariantService implements IProductVariantService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getById(id: number | string): Promise<AxiosResponse<Response<VariantDetailDto>>> {
    return this.httpService.call().get<VariantDetailDto, AxiosResponse<Response<VariantDetailDto>>>(`/product-variants/${id}`);
  }

  rate(id: number, model: RateProductVariantModel): Promise<AxiosResponse<Response<VariantRatingDto>>> {
    return this.httpService.call().post<VariantRatingDto, AxiosResponse<Response<VariantRatingDto>>>(`/product-variants/rating/${id}`, model);
  }

  create(model: ProductVariantCreateRequest): Promise<AxiosResponse<Response<ProductVariantResponseDto>>> {
    return this.httpService.call().post<ProductVariantResponseDto, AxiosResponse<Response<ProductVariantResponseDto>>>('/product-variants', model);
  }

  update(id: number, model: ProductVariantUpdateRequest): Promise<AxiosResponse<Response<ProductVariantResponseDto>>> {
    return this.httpService.call().put<ProductVariantResponseDto, AxiosResponse<Response<ProductVariantResponseDto>>>(`/product-variants/${id}`, model);
  }

  getAllPublic(params?: ProductVariantFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<ProductVariantListItemDto>, AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>>(
        '/product-variants/public',
        { params }
      );
  }

  getAll(params?: ProductVariantFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<ProductVariantListItemDto>, AxiosResponse<Response<ListResponseDto<ProductVariantListItemDto>>>>('/product-variants', {
        params,
      });
  }

  getByProductId(
    productId: number | string,
    params?: { page?: number; recordPerPage?: number }
  ): Promise<AxiosResponse<Response<ListResponseDto<ProductVariantResponseDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<ProductVariantResponseDto>, AxiosResponse<Response<ListResponseDto<ProductVariantResponseDto>>>>(
        `/product-variants/product/${productId}`,
        { params }
      );
  }

  getEffective(productId: number | string, date?: string): Promise<AxiosResponse<Response<ProductVariantResponseDto>>> {
    return this.httpService
      .call()
      .get<ProductVariantResponseDto, AxiosResponse<Response<ProductVariantResponseDto>>>(`/product-variants/product/${productId}/effective`, {
        params: date ? { date } : undefined,
      });
  }
}
