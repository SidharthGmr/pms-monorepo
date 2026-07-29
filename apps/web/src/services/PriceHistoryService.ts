import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto } from '@/dtos/price-history.dto';
import Response from '@/dtos/Response';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '@/models/price-history.model';
import { PriceHistoryFilterParams } from '@/params/price-history.params';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IPriceHistoryService from './interfaces/IPriceHistoryService';

@injectable()
export default class PriceHistoryService implements IPriceHistoryService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  getAll(params?: PriceHistoryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<PriceHistoryDto>, AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>>('/price-histories', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<PriceHistoryDto>>> {
    return this.httpService.call().get<PriceHistoryDto, AxiosResponse<Response<PriceHistoryDto>>>(`/price-histories/${id}`);
  }

  getByVariant(
    variantId: number | string,
    params?: { page?: number; recordPerPage?: number }
  ): Promise<AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<PriceHistoryDto>, AxiosResponse<Response<ListResponseDto<PriceHistoryDto>>>>(
        `/price-histories/variant/${variantId}`,
        { params }
      );
  }

  getEffective(variantId: number | string, date?: string): Promise<AxiosResponse<Response<PriceHistoryDto>>> {
    return this.httpService
      .call()
      .get<PriceHistoryDto, AxiosResponse<Response<PriceHistoryDto>>>(`/price-histories/variant/${variantId}/effective`, {
        params: date ? { date } : undefined,
      });
  }

  getSummary(variantId: number | string): Promise<AxiosResponse<Response<PriceHistorySummaryDto>>> {
    return this.httpService
      .call()
      .get<PriceHistorySummaryDto, AxiosResponse<Response<PriceHistorySummaryDto>>>(`/price-histories/summary/${variantId}`);
  }

  create(model: CreatePriceHistoryModel): Promise<AxiosResponse<Response<PriceHistoryDto>>> {
    return this.httpService.call().post<PriceHistoryDto, AxiosResponse<Response<PriceHistoryDto>>>('/price-histories', model);
  }

  update(id: number | string, model: UpdatePriceHistoryModel): Promise<AxiosResponse<Response<PriceHistoryDto>>> {
    return this.httpService.call().put<PriceHistoryDto, AxiosResponse<Response<PriceHistoryDto>>>(`/price-histories/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<PriceHistoryDto>>> {
    return this.httpService.call().delete<PriceHistoryDto, AxiosResponse<Response<PriceHistoryDto>>>(`/price-histories/${id}`);
  }
}
