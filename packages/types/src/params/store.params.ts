import { Status } from '../enum/status.enum';
import { PageFilterParams } from './page.params';

export interface StoreFilterParams extends PageFilterParams {
  status?: Status | null;
  isActive?: boolean | null;
}
