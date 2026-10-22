import { CustomResponse as Response, ListResponseDto, PurchaseResponseDto, PurchaseFilterParams } from '@pms/types';
import { AxiosResponse } from 'axios';
import { CreatePurchaseModel } from '../PurchaseService';

export interface IPurchaseService {
  createPurchase(model: CreatePurchaseModel): Promise<AxiosResponse<Response<any>>>;
  getAll(params?: PurchaseFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PurchaseResponseDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<PurchaseResponseDto>>>;
}
