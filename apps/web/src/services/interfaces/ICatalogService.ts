import { CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, CustomResponse as Response, ListResponseDto } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ICatalogService {
  getAll(params?: CatalogFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CatalogProductDto>>>>;
  getBySlug(slug: string): Promise<AxiosResponse<Response<CatalogProductDto>>>;
  getFacets(storeCode?: string): Promise<AxiosResponse<Response<CatalogFacetsDto>>>;
}
