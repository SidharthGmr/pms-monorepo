import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  CustomResponse as Response,
  EstimateConvertModel,
  EstimateDto,
  EstimateFilterParams,
  EstimateModel,
  EstimateStatusModel,
  ListResponseDto,
  OrderDto,
  ShareLinkDto,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IEstimateService from './interfaces/IEstimateService';

@injectable()
export default class EstimateService implements IEstimateService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: EstimateModel): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().post<EstimateDto, AxiosResponse<Response<EstimateDto>>>('/estimates', model);
  }

  getAll(params?: EstimateFilterParams): Promise<AxiosResponse<Response<ListResponseDto<EstimateDto>>>> {
    return this.httpService.call().get<ListResponseDto<EstimateDto>, AxiosResponse<Response<ListResponseDto<EstimateDto>>>>('/estimates', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().get<EstimateDto, AxiosResponse<Response<EstimateDto>>>(`/estimates/${id}`);
  }

  getByNumber(estimateNumber: string): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().get<EstimateDto, AxiosResponse<Response<EstimateDto>>>(`/estimates/number/${encodeURIComponent(estimateNumber)}`);
  }

  update(id: number | string, model: EstimateModel): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().put<EstimateDto, AxiosResponse<Response<EstimateDto>>>(`/estimates/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().delete<EstimateDto, AxiosResponse<Response<EstimateDto>>>(`/estimates/${id}`);
  }

  updateStatus(id: number | string, model: EstimateStatusModel): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().patch<EstimateDto, AxiosResponse<Response<EstimateDto>>>(`/estimates/${id}/status`, model);
  }

  duplicate(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>> {
    return this.httpService.call().post<EstimateDto, AxiosResponse<Response<EstimateDto>>>(`/estimates/${id}/duplicate`, {});
  }

  convert(id: number | string, model: EstimateConvertModel): Promise<AxiosResponse<Response<OrderDto>>> {
    return this.httpService.call().post<OrderDto, AxiosResponse<Response<OrderDto>>>(`/estimates/${id}/convert`, model);
  }

  share(id: number | string): Promise<AxiosResponse<Response<ShareLinkDto>>> {
    return this.httpService.call().post<ShareLinkDto, AxiosResponse<Response<ShareLinkDto>>>(`/estimates/${id}/share`, {});
  }
}
