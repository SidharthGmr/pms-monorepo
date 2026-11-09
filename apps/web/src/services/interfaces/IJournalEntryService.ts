import {
  AccountingBackfillModel,
  AccountingBackfillResultDto,
  CustomResponse as Response,
  DayBookSummaryDto,
  JournalEntryDto,
  JournalEntryFilterParams,
  JournalEntryModel,
  ListResponseDto,
  ReverseJournalEntryModel,
} from '@pms/types';
import { AxiosResponse } from 'axios';

export default interface IJournalEntryService {
  create(model: JournalEntryModel): Promise<AxiosResponse<Response<JournalEntryDto>>>;
  getAll(params?: JournalEntryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<JournalEntryDto>>>>;
  getById(id: number | string): Promise<AxiosResponse<Response<JournalEntryDto>>>;
  reverse(id: number | string, model: ReverseJournalEntryModel): Promise<AxiosResponse<Response<JournalEntryDto>>>;
  getDaySummary(params?: JournalEntryFilterParams): Promise<AxiosResponse<Response<DayBookSummaryDto>>>;
  backfill(model: AccountingBackfillModel): Promise<AxiosResponse<Response<AccountingBackfillResultDto>>>;
}
