import { CustomResponse as Response, ListResponseDto, MasterAttributeDto, CreateMasterAttributeModel, MasterAttributeFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IMasterAttributeService {
  create(model: CreateMasterAttributeModel): Promise<AxiosResponse<Response<MasterAttributeDto>>>;
  getAll(params?: MasterAttributeFilterParams): Promise<AxiosResponse<Response<ListResponseDto<MasterAttributeDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<MasterAttributeDto>>>;
  /** Resolve a group by its stable code instead of a numeric id. */
  getByCode(code: string): Promise<AxiosResponse<Response<MasterAttributeDto>>>;
  update(id: number | string, model: CreateMasterAttributeModel): Promise<AxiosResponse<Response<MasterAttributeDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
