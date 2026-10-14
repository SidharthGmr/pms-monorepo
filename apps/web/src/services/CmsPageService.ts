import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import {
  CmsPageAccessDto,
  CmsPageDto,
  CmsPageFilterParams,
  CmsPageListItemDto,
  CmsPageUnlockResultDto,
  CreateCmsPageModel,
  UpdateCmsPageModel,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import ICmsPageService from './interfaces/ICmsPageService';
import IHttpService from './interfaces/IHttpService';

@injectable()
export default class CmsPageService implements ICmsPageService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreateCmsPageModel): Promise<AxiosResponse<Response<CmsPageDto>>> {
    return this.httpService.call().post<CmsPageDto, AxiosResponse<Response<CmsPageDto>>>('/cms-pages', model);
  }

  getAll(params?: CmsPageFilterParams): Promise<AxiosResponse<Response<ListResponseDto<CmsPageListItemDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<CmsPageListItemDto>, AxiosResponse<Response<ListResponseDto<CmsPageListItemDto>>>>('/cms-pages', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<CmsPageDto>>> {
    return this.httpService.call().get<CmsPageDto, AxiosResponse<Response<CmsPageDto>>>(`/cms-pages/${id}`);
  }

  update(id: number | string, model: UpdateCmsPageModel): Promise<AxiosResponse<Response<CmsPageDto>>> {
    return this.httpService.call().put<CmsPageDto, AxiosResponse<Response<CmsPageDto>>>(`/cms-pages/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<CmsPageDto>>> {
    return this.httpService.call().delete<CmsPageDto, AxiosResponse<Response<CmsPageDto>>>(`/cms-pages/${id}`);
  }

  // Page views are public: externalCall() keeps the clientId gate but sends no bearer token.
  getPublicBySlug(slug: string, accessToken?: string): Promise<AxiosResponse<Response<CmsPageAccessDto>>> {
    return this.httpService.externalCall().get<CmsPageAccessDto, AxiosResponse<Response<CmsPageAccessDto>>>(`/cms-pages/public/${slug}`, {
      ...(accessToken ? { headers: { 'x-page-access': accessToken } } : {}),
    });
  }

  unlock(slug: string, password: string): Promise<AxiosResponse<Response<CmsPageUnlockResultDto>>> {
    return this.httpService
      .externalCall()
      .post<CmsPageUnlockResultDto, AxiosResponse<Response<CmsPageUnlockResultDto>>>(`/cms-pages/public/${slug}/unlock`, { password });
  }
}
