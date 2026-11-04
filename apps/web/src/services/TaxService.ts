import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import ITaxService from './interfaces/ITaxService';
import { CustomResponse as Response, TaxDto, TaxFilterParams, TaxModel, ListResponseDto } from '@pms/types';

@injectable()
export default class TaxService implements ITaxService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: TaxModel): Promise<AxiosResponse<Response<TaxDto>>> {
    return this.httpService.call().post<TaxDto, AxiosResponse<Response<TaxDto>>>('/taxes', model);
  }

  getAll(params?: TaxFilterParams): Promise<AxiosResponse<Response<ListResponseDto<TaxDto>>>> {
    return this.httpService.call().get<ListResponseDto<TaxDto>, AxiosResponse<Response<ListResponseDto<TaxDto>>>>('/taxes', { params });
  }

  getById(id: string): Promise<AxiosResponse<Response<TaxDto>>> {
    return this.httpService.call().get<TaxDto, AxiosResponse<Response<TaxDto>>>(`/taxes/${id}`);
  }

  update(id: string, model: TaxModel): Promise<AxiosResponse<Response<TaxDto>>> {
    return this.httpService.call().put<TaxDto, AxiosResponse<Response<TaxDto>>>(`/taxes/${id}`, model);
  }

  delete(id: string): Promise<AxiosResponse<Response<TaxDto>>> {
    return this.httpService.call().delete<TaxDto, AxiosResponse<Response<TaxDto>>>(`/taxes/${id}`);
  }
}
