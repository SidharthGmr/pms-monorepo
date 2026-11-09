import { PartyType } from '../enum/party-type.enum';
import { PaymentDirection } from '../enum/payment-direction.enum';
import { PaymentMethod } from '../enum/payment-method.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { PageFilterParams } from './page.params';

export interface PaymentFilterParams extends PageFilterParams {
  direction?: PaymentDirection | string;
  method?: PaymentMethod | string;
  paymentStatus?: PaymentStatus | string;
  partyType?: PartyType | string;
  partyId?: string;
  ledgerAccountId?: number;
  orderId?: number;
}
