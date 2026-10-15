import {
  CmsPageAccessDto,
  CmsPageDto,
  CmsPageFilterParams,
  CmsPageListItemDto,
  CmsPageUnlockResultDto,
  CreateCmsPageModel,
  CustomResponse as Response,
  ListResponseDto,
  UpdateCmsPageModel,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface ICmsPageService {
  create(model: CreateCmsPageModel): Promise<AxiosResponse<Response<CmsPageDto>>>;
  getAll(params?: CmsPageFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CmsPageListItemDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<CmsPageDto>>>;
  update(id: number | string, model: UpdateCmsPageModel): Promise<AxiosResponse<Response<CmsPageDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<CmsPageDto>>>;
  getPublicBySlug(slug: string, accessToken?: string): Promise<AxiosResponse<Response<CmsPageAccessDto>>>;
  unlock(slug: string, password: string): Promise<AxiosResponse<Response<CmsPageUnlockResultDto>>>;
}
