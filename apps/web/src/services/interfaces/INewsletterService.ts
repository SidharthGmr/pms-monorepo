import { AxiosResponse } from 'axios';  


import { CustomResponse as Response, NewsletterModel, NewsletterDto } from '@pms/types';
export default interface INewsletterService {
  create(model: NewsletterModel): Promise<AxiosResponse<Response<NewsletterDto>>>;
  getAll(): Promise<AxiosResponse<Response<NewsletterDto[]>>>;
  getById(newsletterId: number | string): Promise<AxiosResponse<Response<NewsletterDto>>>;
  update(newsletterId: number | string, model: NewsletterModel): Promise<AxiosResponse<Response<NewsletterDto>>>;
  delete(newsletterId: number | string): Promise<AxiosResponse<Response<void>>>;
}
