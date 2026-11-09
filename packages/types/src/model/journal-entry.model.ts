import { PartyType } from '../enum/party-type.enum';
import { VoucherType } from '../enum/voucher-type.enum';

export interface JournalLineModel {
  ledgerAccountId: number;
  debit?: number | null;
  credit?: number | null;
  narration?: string | null;
  partyType?: PartyType | null;
  partyId?: string | null;
}

export interface JournalEntryModel {
  voucherType?: VoucherType;
  entryDate?: string | null;
  narration?: string | null;
  referenceNumber?: string | null;
  lines: JournalLineModel[];
}

export interface ReverseJournalEntryModel {
  entryDate?: string | null;
  narration?: string | null;
}
