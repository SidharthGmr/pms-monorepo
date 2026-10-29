import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  CustomResponse as Response,
  ListResponseDto,
  MasterEntryDto,
  CreateMasterEntryModel,
  UpdateMasterEntryModel,
  MasterEntryFilterParams,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IMasterEntryService from './interfaces/IMasterEntryService';

@injectable()
export default class MasterEntryService implements IMasterEntryService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  // Create sends a list of values and gets back one entry per value.
  create(model: CreateMasterEntryModel): Promise<AxiosResponse<Response<MasterEntryDto[]>>> {
    return this.httpService.call().post<MasterEntryDto[], AxiosResponse<Response<MasterEntryDto[]>>>('/master-entries', model);
  }

  getAll(params?: MasterEntryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<MasterEntryDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<MasterEntryDto>, AxiosResponse<Response<ListResponseDto<MasterEntryDto>>>>('/master-entries', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<MasterEntryDto>>> {
    return this.httpService.call().get<MasterEntryDto, AxiosResponse<Response<MasterEntryDto>>>(`/master-entries/${id}`);
  }

  update(id: number | string, model: UpdateMasterEntryModel): Promise<AxiosResponse<Response<MasterEntryDto>>> {
    return this.httpService.call().put<MasterEntryDto, AxiosResponse<Response<MasterEntryDto>>>(`/master-entries/${id}`, model);
  }

  delete(id: number | string): Promise<AxiosResponse<Response<void>>> {
    return this.httpService.call().delete<void, AxiosResponse<Response<void>>>(`/master-entries/${id}`);
  }
}
