import {
  CustomResponse as Response,
  ListResponseDto,
  MasterEntryDto,
  CreateMasterEntryModel,
  UpdateMasterEntryModel,
  MasterEntryFilterParams,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IMasterEntryService {
  create(model: CreateMasterEntryModel): Promise<AxiosResponse<Response<MasterEntryDto[]>>>;
  getAll(params?: MasterEntryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<MasterEntryDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<MasterEntryDto>>>;
  update(id: number | string, model: UpdateMasterEntryModel): Promise<AxiosResponse<Response<MasterEntryDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<void>>>;
}
