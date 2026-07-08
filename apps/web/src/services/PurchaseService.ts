import { injectable } from 'inversify';
import { AxiosResponse } from 'axios';
import { TYPES } from '@/config/types';
import { container } from '@/config/ioc';
import IHttpService from './interfaces/IHttpService';
import Response from '@/dtos/Response';
import { IPurchaseService } from './interfaces/IPurchaseService';
import { PurchaseFilterParams } from '@/params/purchase.params';
import { PurchaseDto } from '@/dtos/purchase.dto';
import { ListResponseDto } from '@/dtos/list-response.dto';

export interface CreatePurchaseItemModel {
  productId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface CreatePurchaseModel {
  invoiceNumber?: string;
  invoiceUrl?: string;
  supplierName?: string;
  totalAmount: number;
  notes?: string;
  purchaseDate?: string;
  items: CreatePurchaseItemModel[];
}

@injectable()
export default class PurchaseService implements IPurchaseService {
  private readonly httpService: IHttpService;

  constructor(
    httpService = container.get<IHttpService>(TYPES.IHttpService)
  ) {
    this.httpService = httpService;
  }

  createPurchase(model: CreatePurchaseModel): Promise<AxiosResponse<Response<any>>> {
    return this.httpService
      .call()
      .post<any, AxiosResponse<Response<any>>>('/purchases', model);
  }

  getAll(params?: PurchaseFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PurchaseDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<PurchaseDto>, AxiosResponse<Response<ListResponseDto<PurchaseDto>>>>('/purchases', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<PurchaseDto>>> {
    return this.httpService
      .call()
      .get<PurchaseDto, AxiosResponse<Response<PurchaseDto>>>(`/purchases/${id}`);
  }
}
