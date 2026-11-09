import { DayBookSummaryDto, JournalEntryDto, JournalEntryFilterParams, ListResponseDto } from '@pms/types';

export interface IJournalEntryRepository {
  findAll(
    filters?: JournalEntryFilterParams,
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<ListResponseDto<JournalEntryDto>>;
  findById(id: number, storeCode: string): Promise<JournalEntryDto | null>;
  findBySource(sourceType: string, sourceId: number, storeCode: string): Promise<JournalEntryDto | null>;
  daySummary(filters: JournalEntryFilterParams): Promise<DayBookSummaryDto>;
}
