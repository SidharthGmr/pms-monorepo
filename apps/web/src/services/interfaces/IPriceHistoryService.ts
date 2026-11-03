import {
  CustomResponse as Response,
  ListResponseDto,
  PriceHistoryDto,
  PriceHistorySummaryDto,
  CreatePriceHistoryModel,
  UpdatePriceHistoryModel,
  PriceHistoryFilterParams,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IPriceHistoryService {
  getAll(params?: PriceHistoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>>;

  getById(id: number | string): Promise<AxiosResponse<Response<PriceHistoryDto>>>;
  getByVariant(
    variantId: number | string,
    params?: { page?: number; recordPerPage?: number }
  ): Promise<AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>>;
  getEffective(variantId: number | string, date?: string): Promise<AxiosResponse<Response<PriceHistoryDto>>>;
  getSummary(variantId: number | string): Promise<AxiosResponse<Response<PriceHistorySummaryDto>>>;
  create(model: CreatePriceHistoryModel): Promise<AxiosResponse<Response<PriceHistoryDto>>>;
  update(id: number | string, model: UpdatePriceHistoryModel): Promise<AxiosResponse<Response<PriceHistoryDto>>>;

  delete(id: number | string): Promise<AxiosResponse<Response<PriceHistoryDto>>>;
}
