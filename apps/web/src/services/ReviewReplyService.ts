import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { ReviewReplyDto } from '@/dtos/review.dto';
import { CreateReviewReplyModel, UpdateReviewReplyModel } from '@/models/review.model';
import { ReviewReplyFilterParams } from '@/params/review.params';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IReviewReplyService from './interfaces/IReviewReplyService';

@injectable()
export default class ReviewReplyService implements IReviewReplyService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreateReviewReplyModel): Promise<AxiosResponse<Response<ReviewReplyDto>>> {
    return this.httpService.call().post<ReviewReplyDto, AxiosResponse<Response<ReviewReplyDto>>>('/review-replies', model);
  }

  getAll(params?: ReviewReplyFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ReviewReplyDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<ReviewReplyDto>, AxiosResponse<Response<ListResponseDto<ReviewReplyDto>>>>('/review-replies', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<ReviewReplyDto>>> {
    return this.httpService.call().get<ReviewReplyDto, AxiosResponse<Response<ReviewReplyDto>>>(`/review-replies/${id}`);
  }

  update(id: number | string, model: UpdateReviewReplyModel): Promise<AxiosResponse<Response<ReviewReplyDto>>> {
    return this.httpService.call().put<ReviewReplyDto, AxiosResponse<Response<ReviewReplyDto>>>(`/review-replies/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/review-replies/${id}`);
  }
}
