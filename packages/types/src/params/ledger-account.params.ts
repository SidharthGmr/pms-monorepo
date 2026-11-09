import { AccountCategory } from '../enum/account-category.enum';
import { AccountSubType } from '../enum/account-sub-type.enum';
import { Status } from '../enum/status.enum';
import { PageFilterParams } from './page.params';

export interface LedgerAccountFilterParams extends PageFilterParams {
  status?: Status | string;
  category?: AccountCategory | string;
  subType?: AccountSubType | string;
  parentId?: number;
  isActive?: boolean;
  /** Leaf accounts only - what a voucher line may actually be posted against. */
  postableOnly?: boolean;
}
