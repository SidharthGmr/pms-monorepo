import { AccountCategory } from '../enum/account-category.enum';
import { AccountSubType } from '../enum/account-sub-type.enum';
import { Status } from '../enum/status.enum';

export interface LedgerAccountModel {
  code: string;
  name: string;
  category: AccountCategory;
  subType?: AccountSubType;
  parentId?: number | null;
  description?: string | null;
  isActive?: boolean;
  status?: Status;
  displayOrder?: number;
}
