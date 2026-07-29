import { ListResponseDto } from '@/dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto } from '@/dtos/price-history.dto';
import Response from '@/dtos/Response';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '@/models/price-history.model';
import { PriceHistoryFilterParams } from '@/params/price-history.params';
import { AxiosResponse } from 'axios';

export default interface IPriceHistoryService {
  getAll(params?: PriceHistoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>>;

  getById(id: number | string): Promise<AxiosResponse<Response<PriceHistoryDto>>>;

  /** Paginated ledger for one variant, newest effective date first. */
  getByVariant(
    variantId: number | string,
    params?: { page?: number; recordPerPage?: number }
  ): Promise<AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>>;

  /** The price effective on a given date (defaults to now). */
  getEffective(variantId: number | string, date?: string): Promise<AxiosResponse<Response<PriceHistoryDto>>>;

  /** Current/first/min/max/average price for the summary tiles. */
  getSummary(variantId: number | string): Promise<AxiosResponse<Response<PriceHistorySummaryDto>>>;

  /** Appends a price row; the API refreshes the variant's cached price when it is the effective one. */
  create(model: CreatePriceHistoryModel): Promise<AxiosResponse<Response<PriceHistoryDto>>>;

  /** Correction path - admin only on the API side. */
  update(id: number | string, model: UpdatePriceHistoryModel): Promise<AxiosResponse<Response<PriceHistoryDto>>>;

  delete(id: number | string): Promise<AxiosResponse<Response<PriceHistoryDto>>>;
}
