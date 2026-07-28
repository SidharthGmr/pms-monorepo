import { ListResponseDto } from '@/dtos/list-response.dto';
import { MasterAttributeDto } from '@/dtos/master-entry.dto';
import Response from '@/dtos/Response';
import { CreateMasterAttributeModel } from '@/models/master-entry.model';
import { MasterAttributeFilterParams } from '@/params/master-entry.params';
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
