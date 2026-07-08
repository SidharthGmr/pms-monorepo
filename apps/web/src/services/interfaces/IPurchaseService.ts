import Response from '@/dtos/Response';
import { ListResponseDto } from '@/dtos/list-response.dto';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { PurchaseFilterParams } from '@/params/purchase.params';
import { AxiosResponse } from 'axios';
import { CreatePurchaseModel } from '../PurchaseService';

export interface IPurchaseService {
  createPurchase(model: CreatePurchaseModel): Promise<AxiosResponse<Response<any>>>;
  getAll(params?: PurchaseFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PurchaseDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<PurchaseDto>>>;
}
