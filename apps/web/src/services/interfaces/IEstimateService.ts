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

export default interface IEstimateService {
  create(model: EstimateModel): Promise<AxiosResponse<Response<EstimateDto>>>;
  getAll(params?: EstimateFilterParams): Promise<AxiosResponse<Response<ListResponseDto<EstimateDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>>;
  getByNumber(estimateNumber: string): Promise<AxiosResponse<Response<EstimateDto>>>;
  update(id: number | string, model: EstimateModel): Promise<AxiosResponse<Response<EstimateDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>>;
  updateStatus(id: number | string, model: EstimateStatusModel): Promise<AxiosResponse<Response<EstimateDto>>>;
  duplicate(id: number | string): Promise<AxiosResponse<Response<EstimateDto>>>;
  convert(id: number | string, model: EstimateConvertModel): Promise<AxiosResponse<Response<OrderDto>>>;
  share(id: number | string): Promise<AxiosResponse<Response<ShareLinkDto>>>;
}
