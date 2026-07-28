import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { ReviewDto, ReviewSummaryDto } from '@/dtos/review.dto';
import { CreateReviewModel, UpdateReviewModel } from '@/models/review.model';
import { ReviewFilterParams } from '@/params/review.params';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IReviewService from './interfaces/IReviewService';

@injectable()
export default class ReviewService implements IReviewService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreateReviewModel): Promise<AxiosResponse<Response<ReviewDto>>> {
    return this.httpService.call().post<ReviewDto, AxiosResponse<Response<ReviewDto>>>('/reviews', model);
  }

  getAll(params?: ReviewFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ReviewDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<ReviewDto>, AxiosResponse<Response<ListResponseDto<ReviewDto>>>>('/reviews', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<ReviewDto>>> {
    return this.httpService.call().get<ReviewDto, AxiosResponse<Response<ReviewDto>>>(`/reviews/${id}`);
  }

  getSummary(productId: number | string): Promise<AxiosResponse<Response<ReviewSummaryDto>>> {
    return this.httpService.call().get<ReviewSummaryDto, AxiosResponse<Response<ReviewSummaryDto>>>(`/reviews/summary/${productId}`);
  }

  update(id: number | string, model: UpdateReviewModel): Promise<AxiosResponse<Response<ReviewDto>>> {
    return this.httpService.call().put<ReviewDto, AxiosResponse<Response<ReviewDto>>>(`/reviews/${id}`, model);
  }

  moderate(id: number | string, status: string): Promise<AxiosResponse<Response<ReviewDto>>> {
    return this.httpService.call().patch<ReviewDto, AxiosResponse<Response<ReviewDto>>>(`/reviews/moderate/${id}`, { status });
  }

  delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/reviews/${id}`);
  }
}
