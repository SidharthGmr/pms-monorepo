import { EstimateStatus } from '../enum/estimate-status.enum';
import { PageFilterParams } from './page.params';

export interface EstimateFilterParams extends PageFilterParams {
  status?: EstimateStatus | string;
  customerId?: string;
}
