import {
  CmsPageAccessDto,
  CmsPageDto,
  CmsPageFilterParams,
  CmsPageListItemDto,
  CmsPageSitemapEntryDto,
  CmsPageUnlockResultDto,
  CreateCmsPageModel,
  ListResponseDto,
  UpdateCmsPageModel,
} from '@pms/types';

export interface ICmsPageService {
  create(model: CreateCmsPageModel, storeCode: string, actorUserId?: string): Promise<CmsPageDto>;
  getAll(filters?: CmsPageFilterParams): Promise<ListResponseDto<CmsPageListItemDto>>;
  getById(id: number, storeCode: string): Promise<CmsPageDto>;
  update(id: number, model: UpdateCmsPageModel, storeCode: string, actorUserId?: string): Promise<CmsPageDto>;
  delete(id: number, storeCode: string): Promise<CmsPageDto>;
  getPublicBySlug(slug: string, accessToken?: string): Promise<CmsPageAccessDto>;
  unlock(slug: string, password: string): Promise<CmsPageUnlockResultDto>;
  getSitemapEntries(): Promise<CmsPageSitemapEntryDto[]>;
}
