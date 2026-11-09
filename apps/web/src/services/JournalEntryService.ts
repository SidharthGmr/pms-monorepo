import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
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
import { injectable } from 'inversify';
import IHttpService from './interfaces/IHttpService';
import IJournalEntryService from './interfaces/IJournalEntryService';

@injectable()
export default class JournalEntryService implements IJournalEntryService {
  private readonly httpService: IHttpService;

  constructor(httpService = container.get<IHttpService>(TYPES.IHttpService)) {
    this.httpService = httpService;
  }

  create(model: JournalEntryModel): Promise<AxiosResponse<Response<JournalEntryDto>>> {
    return this.httpService.call().post<JournalEntryDto, AxiosResponse<Response<JournalEntryDto>>>('/journal-entries', model);
  }

  getAll(params?: JournalEntryFilterParams): Promise<AxiosResponse<Response<ListResponseDto<JournalEntryDto>>>> {
    return this.httpService
      .call()
      .get<ListResponseDto<JournalEntryDto>, AxiosResponse<Response<ListResponseDto<JournalEntryDto>>>>('/journal-entries', { params });
  }

  getById(id: number | string): Promise<AxiosResponse<Response<JournalEntryDto>>> {
    return this.httpService.call().get<JournalEntryDto, AxiosResponse<Response<JournalEntryDto>>>(`/journal-entries/${id}`);
  }

  reverse(id: number | string, model: ReverseJournalEntryModel): Promise<AxiosResponse<Response<JournalEntryDto>>> {
    return this.httpService.call().post<JournalEntryDto, AxiosResponse<Response<JournalEntryDto>>>(`/journal-entries/${id}/reverse`, model);
  }

  getDaySummary(params?: JournalEntryFilterParams): Promise<AxiosResponse<Response<DayBookSummaryDto>>> {
    return this.httpService
      .call()
      .get<DayBookSummaryDto, AxiosResponse<Response<DayBookSummaryDto>>>('/journal-entries/day-book-summary', { params });
  }

  backfill(model: AccountingBackfillModel): Promise<AxiosResponse<Response<AccountingBackfillResultDto>>> {
    return this.httpService
      .call()
      .post<AccountingBackfillResultDto, AxiosResponse<Response<AccountingBackfillResultDto>>>('/journal-entries/backfill', model);
  }
}
