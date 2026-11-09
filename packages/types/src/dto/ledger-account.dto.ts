import { AccountCategory } from '../enum/account-category.enum';
import { AccountSubType } from '../enum/account-sub-type.enum';
import { Status } from '../enum/status.enum';

export interface LedgerAccountDto {
  id: number;
  code: string;
  name: string;
  category: AccountCategory;
  subType: AccountSubType;
  parentId: number | null;
  parentName?: string | null;
  description: string | null;
  isSystem: boolean;
  systemKey: string | null;
  isActive: boolean;
  status: Status;
  displayOrder: number;
  /** True when the account holds children, which means it is a header and takes no postings. */
  hasChildren: boolean;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

export interface LedgerAccountTreeDto extends LedgerAccountDto {
  children: LedgerAccountTreeDto[];
}

/** An account plus what it is worth, used by the ledger and trial-balance reads. */
export interface LedgerAccountBalanceDto {
  accountId: number;
  code: string;
  name: string;
  category: AccountCategory;
  subType: AccountSubType;
  totalDebit: number;
  totalCredit: number;
  /** Positive means the account sits on its natural side; negative means it is the other way round. */
  balance: number;
}
