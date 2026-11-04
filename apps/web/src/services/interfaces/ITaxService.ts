import { AxiosResponse } from 'axios';
import { CustomResponse as Response, TaxDto, TaxFilterParams, TaxModel, ListResponseDto } from '@pms/types';

export default interface ITaxService {
  create(model: TaxModel): Promise<AxiosResponse<Response<TaxDto>>>;
  getAll(params?: TaxFilterParams): Promise<AxiosResponse<Response<ListResponseDto<TaxDto>>>>;
  getById(id: string): Promise<AxiosResponse<Response<TaxDto>>>;
  update(id: string, model: TaxModel): Promise<AxiosResponse<Response<TaxDto>>>;
  delete(id: string): Promise<AxiosResponse<Response<TaxDto>>>;
}
