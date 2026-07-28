import { ListResponseDto } from '@/dtos/list-response.dto';
import Response from '@/dtos/Response';
import { ReviewReplyDto } from '@/dtos/review.dto';
import { CreateReviewReplyModel, UpdateReviewReplyModel } from '@/models/review.model';
import { ReviewReplyFilterParams } from '@/params/review.params';
import { AxiosResponse } from 'axios';

export default interface IReviewReplyService {
  create(model: CreateReviewReplyModel): Promise<AxiosResponse<Response<ReviewReplyDto>>>;
  getAll(params?: ReviewReplyFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ReviewReplyDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ReviewReplyDto>>>;
  update(id: number | string, model: UpdateReviewReplyModel): Promise<AxiosResponse<Response<ReviewReplyDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
