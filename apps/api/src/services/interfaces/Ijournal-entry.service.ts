import { DayBookSummaryDto, JournalEntryDto, JournalEntryFilterParams, JournalEntryModel, ListResponseDto, ReverseJournalEntryModel } from '@pms/types';
import { Prisma } from '@prisma/client';

/**
 * What a posting rule hands the journal when a document is saved. It travels on the caller's
 * transaction client so a sale and its voucher commit together or not at all.
 */
export interface PostingRequest {
  storeCode: string;
  createdById: string;
  voucherType: JournalEntryModel['voucherType'];
  entryDate: Date;
  narration?: string | null;
  referenceNumber?: string | null;
  sourceType?: string | null;
  sourceId?: number | null;
  isOpening?: boolean;
  lines: {
    ledgerAccountId: number;
    debit?: number | null;
    credit?: number | null;
    narration?: string | null;
    partyType?: string | null;
    partyId?: string | null;
  }[];
}

export interface IJournalEntryService {
  create(data: JournalEntryModel, storeCode: string, createdById: string): Promise<JournalEntryDto>;
  getAll(filters?: JournalEntryFilterParams): Promise<ListResponseDto<JournalEntryDto>>;
  getById(id: number, storeCode: string): Promise<JournalEntryDto | null>;
  getDaySummary(filters: JournalEntryFilterParams): Promise<DayBookSummaryDto>;
  reverse(id: number, data: ReverseJournalEntryModel, storeCode: string, createdById: string): Promise<JournalEntryDto>;
  post(request: PostingRequest, transactionClient: Prisma.TransactionClient): Promise<number>;
  resolveAccountIds(storeCode: string, systemKeys: string[], transactionClient: Prisma.TransactionClient): Promise<Map<string, number>>;
}
