import { JournalStatus } from '../enum/journal-status.enum';
import { PartyType } from '../enum/party-type.enum';
import { VoucherType } from '../enum/voucher-type.enum';
import { PageFilterParams } from './page.params';

export interface JournalEntryFilterParams extends PageFilterParams {
  voucherType?: VoucherType | string;
  journalStatus?: JournalStatus | string;
  ledgerAccountId?: number;
  partyType?: PartyType | string;
  partyId?: string;
  financialYearId?: number;
}
