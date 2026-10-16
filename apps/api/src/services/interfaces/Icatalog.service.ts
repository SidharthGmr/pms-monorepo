import { CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, ListResponseDto } from "@pms/types";

export interface ICatalogService {
  getAll(filters?: CatalogFilterParams): Promise<ListResponseDto<CatalogProductDto>>;
  getBySlug(slug: string, storeCode?: string): Promise<CatalogProductDto>;
  getFacets(storeCode?: string): Promise<CatalogFacetsDto>;
}
