import { PaymentStatus } from '../enum/payment-status.enum';
import { PageFilterParams } from './page.params';

export interface StaffSalaryFilterParams extends PageFilterParams {
  staffId?: number | null;
  month?: number | null;
  year?: number | null;
  status?: PaymentStatus | string | null;
}
