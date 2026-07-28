import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { ReviewDto, ReviewSummaryDto } from '@/dtos/review.dto';
import { CreateReviewModel, UpdateReviewModel } from '@/models/review.model';
import { ReviewFilterParams } from '@/params/review.params';
import { AxiosResponse } from 'axios';

export default interface IReviewService {
  create(model: CreateReviewModel): Promise<AxiosResponse<Response<ReviewDto>>>;
  getAll(params?: ReviewFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ReviewDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ReviewDto>>>;
  getSummary(productId: number | string): Promise<AxiosResponse<Response<ReviewSummaryDto>>>;
  update(id: number | string, model: UpdateReviewModel): Promise<AxiosResponse<Response<ReviewDto>>>;
  /** Staff-only endpoint - separate from `update` so the admin UI cannot send text edits by accident. */
  moderate(id: number | string, status: string): Promise<AxiosResponse<Response<ReviewDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
