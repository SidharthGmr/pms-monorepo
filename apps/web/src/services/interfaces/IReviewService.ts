import { CustomResponse as Response, ListResponseDto, ReviewDto, ReviewSummaryDto, CreateReviewModel, UpdateReviewModel, ReviewFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IReviewService {
  create(model: CreateReviewModel): Promise<AxiosResponse<Response<ReviewDto>>>;
  getAll(params?: ReviewFilterParams): Promise<AxiosResponse<Response<ListResponseDto<ReviewDto>>>>;
  /** Public storefront reads - no bearer token, Published reviews only. */
  getAllPublic(params: { productId: number; page?: number; recordPerPage?: number }): Promise<AxiosResponse<Response<ListResponseDto<ReviewDto>>>>;
  getPublicSummary(productId: number | string): Promise<AxiosResponse<Response<ReviewSummaryDto>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<ReviewDto>>>;
  getSummary(productId: number | string): Promise<AxiosResponse<Response<ReviewSummaryDto>>>;
  update(id: number | string, model: UpdateReviewModel): Promise<AxiosResponse<Response<ReviewDto>>>;
  /** Staff-only endpoint - separate from `update` so the admin UI cannot send text edits by accident. */
  moderate(id: number | string, status: string): Promise<AxiosResponse<Response<ReviewDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
