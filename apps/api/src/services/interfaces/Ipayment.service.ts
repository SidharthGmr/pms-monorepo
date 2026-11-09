import {
  CreatePaymentDto,
  ListResponseDto,
  OutstandingSummaryDto,
  PaymentDto,
  PaymentFilterParams,
  PaymentTransferModel,
  PaymentVoucherDto,
  PaymentVoucherModel,
  ReversePaymentModel,
  UpdatePaymentDto,
} from '@pms/types';

export interface IPaymentService {
  getByOrderId(orderId: number, storeCode: string): Promise<PaymentDto[]>;
  getById(id: number, storeCode: string): Promise<PaymentDto | null>;
  create(data: CreatePaymentDto, storeCode: string, userId: string): Promise<PaymentDto>;
  update(id: number, data: UpdatePaymentDto, storeCode: string, userId: string): Promise<PaymentDto>;
  delete(id: number, storeCode: string): Promise<PaymentDto>;
  createVoucher(data: PaymentVoucherModel, storeCode: string, userId: string): Promise<PaymentVoucherDto>;
  transfer(data: PaymentTransferModel, storeCode: string, userId: string): Promise<PaymentVoucherDto>;
  getAllVouchers(filters?: PaymentFilterParams): Promise<ListResponseDto<PaymentVoucherDto>>;
  getVoucherById(id: number, storeCode: string): Promise<PaymentVoucherDto>;
  reverseVoucher(id: number, data: ReversePaymentModel, storeCode: string, userId: string): Promise<PaymentVoucherDto>;
  getOutstanding(storeCode: string): Promise<OutstandingSummaryDto>;
}
