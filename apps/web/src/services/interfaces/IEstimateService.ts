import { CustomResponse as Response, EstimateDto, EstimateFilterParams, EstimateModel, ListResponseDto } from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IEstimateService {
  create(model: EstimateModel): Promise<AxiosResponse<Response<EstimateDto>>>;
  getAll(params?: EstimateFilterParams): Promise<AxiosResponse<Response<ListResponseDto<EstimateDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>>;
  update(id: number | string, model: EstimateModel): Promise<AxiosResponse<Response<EstimateDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>>;
}
