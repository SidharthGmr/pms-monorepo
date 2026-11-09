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

export default interface IPaymentService {
  create(model: CreatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>>;
  getByOrderId(orderId: number | string): Promise<AxiosResponse<Response<PaymentDto[]>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>>;
  update(id: number | string, model: UpdatePaymentModel): Promise<AxiosResponse<Response<PaymentDto>>>;
  delete(id: number | string): Promise<AxiosResponse<Response<PaymentDto>>>;
  createVoucher(model: PaymentVoucherModel): Promise<AxiosResponse<Response<PaymentVoucherDto>>>;
  transfer(model: PaymentTransferModel): Promise<AxiosResponse<Response<PaymentVoucherDto>>>;
  getAllVouchers(params?: PaymentFilterParams): Promise<AxiosResponse<Response<ListResponseDto<PaymentVoucherDto>>>>;
  getVoucherById(id: number | string): Promise<AxiosResponse<Response<PaymentVoucherDto>>>;
  reverseVoucher(id: number | string, model: ReversePaymentModel): Promise<AxiosResponse<Response<PaymentVoucherDto>>>;
  getPartyStatement(params: PartyStatementParams): Promise<AxiosResponse<Response<PartyStatementDto>>>;
  getOutstanding(): Promise<AxiosResponse<Response<OutstandingSummaryDto>>>;
}
