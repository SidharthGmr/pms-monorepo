import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import {
  CreatePaymentModel,
  CustomResponse as Response,
  ListResponseDto,
  OutstandingSummaryDto,
  PaymentDto,
  PaymentFilterParams,
  PaymentTransferModel,
  PaymentVoucherDto,
  PaymentVoucherModel,
  ReversePaymentModel,
  UpdatePaymentModel,
  PartyStatementDto,
  PartyStatementParams,
} from '@pms/types';
import { AxiosResponse } from 'axios';
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IPaymentService from './interfaces/IPaymentService';

@injectable()
export default class PaymentService implements IPaymentService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: CreatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().post<PaymentDto, AxiosResponse<Response<PaymentDto>>>('/payments', model);
  }

  getByOrderId(orderId: number | string): Promise<AxiosResponse<Response<PaymentDto[]>>> {
    return this.httpService.call().get<PaymentDto[], AxiosResponse<Response<PaymentDto[]>>>(`/payments/order/${orderId}`);
  }

  getById(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().get<PaymentDto, AxiosResponse<Response<PaymentDto>>>(`/payments/${id}`);
  }

  update(id: number | string, model: UpdatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().put<PaymentDto, AxiosResponse<Response<PaymentDto>>>(`/payments/${id}`, model);
  }

  createVoucher(model: PaymentVoucherModel): Promise<AxiosResponse<Response<PaymentVoucherDto>>> {
    return this.httpService.call().post<PaymentVoucherDto, AxiosResponse<Response<PaymentVoucherDto>>>('/payments/vouchers', model);
  }

  transfer(model: PaymentTransferModel): Promise<AxiosResponse<Response<PaymentVoucherDto>>> {
    return this.httpService.call().post<PaymentVoucherDto, AxiosResponse<Response<PaymentVoucherDto>>>('/payments/transfers', model);
  }

  getAllVouchers(params?: PaymentFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PaymentVoucherDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<PaymentVoucherDto>, AxiosResponse<Response<ListResponseDto<PaymentVoucherDto>>>>('/payments/vouchers', { params });
  }

  getVoucherById(id: number | string): Promise<AxiosResponse<Response<PaymentVoucherDto>>> {
    return this.httpService.call().get<PaymentVoucherDto, AxiosResponse<Response<PaymentVoucherDto>>>(`/payments/vouchers/${id}`);
  }

  reverseVoucher(id: number | string, model: ReversePaymentModel): Promise<AxiosResponse<Response<PaymentVoucherDto>>> {
    return this.httpService.call().post<PaymentVoucherDto, AxiosResponse<Response<PaymentVoucherDto>>>(`/payments/${id}/reverse`, model);
  }

  getPartyStatement(params: PartyStatementParams): Promise<AxiosResponse<Response<PartyStatementDto>>> {
    return this.httpService.call().get<PartyStatementDto, AxiosResponse<Response<PartyStatementDto>>>('/payments/party-statement', { params });
  }

  getOutstanding(): Promise<AxiosResponse<Response<OutstandingSummaryDto>>> {
    return this.httpService.call().get<OutstandingSummaryDto, AxiosResponse<Response<OutstandingSummaryDto>>>('/payments/outstanding');
  }

  delete(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>> {
    return this.httpService.call().delete<PaymentDto, AxiosResponse<Response<PaymentDto>>>(`/payments/${id}`);
  }
}
