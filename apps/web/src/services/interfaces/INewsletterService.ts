import { AxiosResponse } from 'axios';  
import { NewsletterModel } from '@/models/newsletter.model';
import {   NewsletterDto } from '@/dtos/newsletter.dto';
import Response from '@/dtos/Response';

export default interface INewsletterService {
  create(model: NewsletterModel): Promise<AxiosResponse<Response<NewsletterDto>>>;
  getAll(): Promise<AxiosResponse<Response<NewsletterDto[]>>>;
  getById(newsletterId: number | string): Promise<AxiosResponse<Response<NewsletterDto>>>;
  update(newsletterId: number | string, model: NewsletterModel): Promise<AxiosResponse<Response<NewsletterDto>>>;
  delete(newsletterId: number | string): Promise<AxiosResponse<Response<void>>>;
}
