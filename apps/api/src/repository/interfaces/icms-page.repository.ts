import { CmsPageFilterParams, CmsPageListItemDto, CmsPageSitemapEntryDto, ListResponseDto } from "@pms/types";
import { CmsPage, Prisma } from "@prisma/client";

export interface ICmsPageRepository {
  create(data: Prisma.CmsPageUncheckedCreateInput): Promise<CmsPage>;
  findAll(filters?: CmsPageFilterParams): Promise<ListResponseDto<CmsPageListItemDto>>;
  findById(id: number): Promise<CmsPage | null>;
  /** Full row including passwordHash - for internal gate checks only, never returned as-is. */
  findBySlug(slug: string): Promise<CmsPage | null>;
  slugExists(slug: string, excludeId?: number): Promise<boolean>;
  update(id: number, data: Prisma.CmsPageUncheckedUpdateInput): Promise<CmsPage>;
  delete(id: number): Promise<CmsPage>;
  findForSitemap(): Promise<CmsPageSitemapEntryDto[]>;
}
