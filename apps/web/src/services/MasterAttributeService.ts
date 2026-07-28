import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { MasterAttributeDto } from '@/dtos/master-entry.dto';
import Response from '@/dtos/Response';
import { CreateMasterAttributeModel } from '@/models/master-entry.model';
import { MasterAttributeFilterParams } from '@/params/master-entry.params';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IMasterAttributeService from './interfaces/IMasterAttributeService';

@injectable()
export default class MasterAttributeService implements IMasterAttributeService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreateMasterAttributeModel): Promise<AxiosResponse<Response<MasterAttributeDto>>> {
    return this.httpService.call().post<MasterAttributeDto, AxiosResponse<Response<MasterAttributeDto>>>('/master-attributes', model);
  }

  getAll(params?: MasterAttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<MasterAttributeDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<MasterAttributeDto>, AxiosResponse<Response<ListResponseDto<MasterAttributeDto>>>>('/master-attributes', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<MasterAttributeDto>>> {
    return this.httpService.call().get<MasterAttributeDto, AxiosResponse<Response<MasterAttributeDto>>>(`/master-attributes/${id}`);
  }

  getByCode(code: string): Promise<AxiosResponse<Response<MasterAttributeDto>>> {
    return this.httpService.call().get<MasterAttributeDto, AxiosResponse<Response<MasterAttributeDto>>>(`/master-attributes/code/${code}`);
  }

  update(id: number | string, model: CreateMasterAttributeModel): Promise<AxiosResponse<Response<MasterAttributeDto>>> {
    return this.httpService.call().put<MasterAttributeDto, AxiosResponse<Response<MasterAttributeDto>>>(`/master-attributes/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/master-attributes/${id}`);
  }
}
