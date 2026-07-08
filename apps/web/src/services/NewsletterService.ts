import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import INewsletterService from './interfaces/INewsletterService'; 
import { NewsletterModel } from '@/models/newsletter.model';
import { NewsletterDto } from '@/dtos/newsletter.dto';
import Response from '@/dtos/Response';

@injectable()
export default class NewsletterService implements INewsletterService {
  private readonly httpService: IHttpService;

  constructor(
    httpService = container.get<IHttpService>(TYPES.IHttpService)
  ) {
    this.httpService = httpService;
  }

  create(model: NewsletterModel): Promise<AxiosResponse<Response<NewsletterDto>>> {
    return this.httpService.call().post<NewsletterDto, AxiosResponse<Response<NewsletterDto>>>('/newsletter/create', model);
  }

  getAll(): Promise<AxiosResponse<Response<NewsletterDto[]>>> {
    return this.httpService.call().get<NewsletterDto[], AxiosResponse<Response<NewsletterDto[]>>>('/newsletter');
  }

  getById(newsletterId: number | string): Promise<AxiosResponse<Response<NewsletterDto>>> {
    return this.httpService
      .call()
      .get<NewsletterDto, AxiosResponse<Response<NewsletterDto>>>(`/newsletter/${newsletterId}`);
  }

  update(newsletterId: number | string, model: NewsletterModel): Promise<AxiosResponse<Response<NewsletterDto>>> {
    return this.httpService
      .call()
      .put<NewsletterDto, AxiosResponse<Response<NewsletterDto>>>(`/newsletter/${newsletterId}`, model);
  }

  delete(newsletterId: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService
      .call()
      .delete<void, AxiosResponse<Response<void>>>(`/newsletter/${newsletterId}`);
  }
}
