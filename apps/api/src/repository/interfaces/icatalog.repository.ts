import { CatalogFacetsDto, CatalogFilterParams, CatalogProductDto, ListResponseDto } from "@pms/types";

export interface ICatalogRepository {
  findAll(filters?: CatalogFilterParams): Promise<ListResponseDto<CatalogProductDto>>;
  findBySlug(slug: string, storeCode?: string): Promise<CatalogProductDto | null>;
  getFacets(storeCode?: string): Promise<CatalogFacetsDto>;
}
