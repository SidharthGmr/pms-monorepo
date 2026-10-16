import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, CustomResponse as Response, ListResponseDto } from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import ICatalogService from './interfaces/ICatalogService';

@injectable()
export default class CatalogService implements ICatalogService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  // Public storefront endpoints: externalCall() keeps the clientId gate but sends no bearer
  // token, so a logged-out visitor is never dragged through the 401 refresh interceptor.
  getAll(params?: CatalogFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CatalogProductDto>>>> {
    const query = {
      ...params,
      categoryIds: params?.categoryIds?.join(','),
      brandNameIds: params?.brandNameIds?.join(','),
      entryIds: params?.entryIds?.join(','),
    };
    return this.httpService.externalCall().get<ListResponseDto<CatalogProductDto>, AxiosResponse<Response<ListResponseDto<CatalogProductDto>>>>('/catalog/products', { params: query });
  }

  getBySlug(slug: string): Promise<AxiosResponse<Response<CatalogProductDto>>> {
    return this.httpService.externalCall().get<CatalogProductDto, AxiosResponse<Response<CatalogProductDto>>>(`/catalog/products/${encodeURIComponent(slug)}`);
  }

  getFacets(storeCode?: string): Promise<AxiosResponse<Response<CatalogFacetsDto>>> {
    return this.httpService.externalCall().get<CatalogFacetsDto, AxiosResponse<Response<CatalogFacetsDto>>>('/catalog/facets', { params: storeCode ? { storeCode } : {} });
  }
}
