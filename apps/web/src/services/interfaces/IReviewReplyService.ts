import { CustomResponse as Response, ListResponseDto, ReviewReplyDto, CreateReviewReplyModel, UpdateReviewReplyModel, ReviewReplyFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IReviewReplyService {
  create(model: CreateReviewReplyModel): Promise<AxiosResponse<Response<ReviewReplyDto>>>;
  getAll(params?: ReviewReplyFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ReviewReplyDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ReviewReplyDto>>>;
  update(id: number | string, model: UpdateReviewReplyModel): Promise<AxiosResponse<Response<ReviewReplyDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
