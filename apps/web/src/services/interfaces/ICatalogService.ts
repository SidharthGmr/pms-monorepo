import { CustomResponse as Response, CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, ListResponseDto } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ICatalogService {
  getAll(params?: CatalogFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CatalogProductDto>>>>;
  getBySlug(slug: string): Promise<AxiosResponse<Response<CatalogProductDto>>>;
  getFacets(storeCode?: string): Promise<AxiosResponse<Response<CatalogFacetsDto>>>;
}
