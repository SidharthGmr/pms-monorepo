import { CustomResponse as Response, ListResponseDto } from '@pms/types';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { PurchaseFilterParams } from '@/params/purchase.params';
import { AxiosResponse } from 'axios';
import { CreatePurchaseModel } from '../PurchaseService';

export interface IPurchaseService {
  createPurchase(model: CreatePurchaseModel): Promise<AxiosResponse<Response<any>>>;
  getAll(params?: PurchaseFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PurchaseDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<PurchaseDto>>>;
}
