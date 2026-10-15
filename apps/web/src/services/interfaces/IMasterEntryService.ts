import { CustomResponse as Response, ListResponseDto } from '@pms/types';
import { MasterEntryDto } from '@/dtos/master-entry.dto';
import { CreateMasterEntryModel } from '@/models/master-entry.model';
import { MasterEntryFilterParams } from '@/params/master-entry.params';
import { AxiosResponse } from 'axios';

export default interface IMasterEntryService {
  create(model: CreateMasterEntryModel): Promise<AxiosResponse<Response<MasterEntryDto>>>;
  getAll(params?: MasterEntryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<MasterEntryDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<MasterEntryDto>>>;
  update(id: number | string, model: CreateMasterEntryModel): Promise<AxiosResponse<Response<MasterEntryDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
