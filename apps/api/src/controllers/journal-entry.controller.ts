import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import {
  AccountingBackfillModel,
  AccountingBackfillResultDto,
  CustomResponse,
  DayBookSummaryDto,
  JournalEntryDto,
  JournalEntryFilterParams,
  JournalEntryModel,
  JournalStatus,
  ListResponseDto,
  PartyType,
  ReverseJournalEntryModel,
  VoucherType,
} from '@pms/types';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class JournalEntryController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<JournalEntryDto>>> => {
    const body = req.body as JournalEntryModel;
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.JournalEntry.create(body, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Journal entry posted successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<JournalEntryDto>>>> => {
    const data = await this.unitOfService.JournalEntry.getAll(this.buildFilters(req));
    return res.status(200).json({ success: true, message: 'Journal entries fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<JournalEntryDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.JournalEntry.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Journal entry fetched successfully', data });
  };

  backfill = async (req: Request, res: Response): Promise<Response<CustomResponse<AccountingBackfillResultDto>>> => {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.AccountingPosting.backfill(req.body as AccountingBackfillModel, storeCode, userId);
    const message = `${data.posted} posted, ${data.skipped} skipped, ${data.failed} failed`;
    return res.status(200).json({ success: true, message, data });
  };

  reverse = async (req: Request, res: Response): Promise<Response<CustomResponse<JournalEntryDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.JournalEntry.reverse(id, req.body as ReverseJournalEntryModel, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Journal entry reversed successfully', data });
  };

  daySummary = async (req: Request, res: Response): Promise<Response<CustomResponse<DayBookSummaryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.JournalEntry.getDaySummary(this.buildFilters(req));
    return res.status(200).json({ success: true, message: 'Day book summary fetched successfully', data });
  };

  // The Day Book's totals have to describe exactly the rows its table shows, so the listing
  // and the summary read the query string through this one parser.
  private buildFilters = (req: Request): JournalEntryFilterParams => {
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    return Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        voucherType: req.query['voucherType'] ? (req.query['voucherType'] as VoucherType) : undefined,
        journalStatus: req.query['journalStatus'] ? (req.query['journalStatus'] as JournalStatus) : undefined,
        ledgerAccountId: req.query['ledgerAccountId'] ? parseInt(req.query['ledgerAccountId'] as string) : undefined,
        partyType: req.query['partyType'] ? (req.query['partyType'] as PartyType) : undefined,
        partyId: req.query['partyId'] as string | undefined,
        financialYearId: req.query['financialYearId'] ? parseInt(req.query['financialYearId'] as string) : undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, value]) => value !== undefined)
    );
  };
}
