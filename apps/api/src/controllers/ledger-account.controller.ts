import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import {
  AccountCategory,
  AccountSubType,
  CustomResponse,
  LedgerAccountDto,
  LedgerAccountFilterParams,
  LedgerAccountModel,
  LedgerAccountTreeDto,
  LedgerStatementDto,
  LedgerStatementFilterParams,
  ListResponseDto,
  PartyType,
  Status,
  TrialBalanceDto,
  ProfitLossDto,
} from '@pms/types';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class LedgerAccountController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<LedgerAccountDto>>> => {
    const body = req.body as LedgerAccountModel;
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.LedgerAccount.create(body, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Ledger account created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<LedgerAccountDto>>>> => {
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: LedgerAccountFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as Status) : undefined,
        category: req.query['category'] ? (req.query['category'] as AccountCategory) : undefined,
        subType: req.query['subType'] ? (req.query['subType'] as AccountSubType) : undefined,
        parentId: req.query['parentId'] ? parseInt(req.query['parentId'] as string) : undefined,
        isActive: req.query['isActive'] !== undefined ? req.query['isActive'] === 'true' : undefined,
        postableOnly: req.query['postableOnly'] !== undefined ? req.query['postableOnly'] === 'true' : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.LedgerAccount.getAll(filters);
    return res.status(200).json({ success: true, message: 'Ledger accounts fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<LedgerAccountDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.LedgerAccount.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Ledger account fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<LedgerAccountDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.LedgerAccount.update(id, req.body as LedgerAccountModel, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Ledger account updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<LedgerAccountDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.LedgerAccount.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Ledger account deleted successfully', data });
  };

  getTree = async (req: Request, res: Response): Promise<Response<CustomResponse<LedgerAccountTreeDto[]>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.LedgerAccount.getTree(storeCode);
    return res.status(200).json({ success: true, message: 'Chart of accounts fetched successfully', data });
  };

  getStatement = async (req: Request, res: Response): Promise<Response<CustomResponse<LedgerStatementDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.LedgerAccount.getStatement(id, storeCode, this.buildStatementFilters(req));
    return res.status(200).json({ success: true, message: 'Ledger statement fetched successfully', data });
  };

  getTrialBalance = async (req: Request, res: Response): Promise<Response<CustomResponse<TrialBalanceDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.LedgerAccount.getTrialBalance(storeCode, this.buildStatementFilters(req));
    return res.status(200).json({ success: true, message: 'Trial balance fetched successfully', data });
  };

  getProfitLoss = async (req: Request, res: Response): Promise<Response<CustomResponse<ProfitLossDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.LedgerAccount.getProfitLoss(storeCode, this.buildStatementFilters(req));
    return res.status(200).json({ success: true, message: 'Profit and loss fetched successfully', data });
  };

  seedDefaults = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<LedgerAccountDto>>>> => {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.LedgerAccount.seedDefaults(storeCode, userId);
    const message = data.totalRecord === 0 ? 'The chart of accounts is already set up' : `${data.totalRecord} accounts added`;
    return res.status(201).json({ success: true, message, data });
  };

  // A statement and the trial balance take the same window, so they read it the same way.
  private buildStatementFilters = (req: Request): LedgerStatementFilterParams =>
    Object.fromEntries(
      Object.entries({
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        partyType: req.query['partyType'] ? (req.query['partyType'] as PartyType) : undefined,
        partyId: req.query['partyId'] as string | undefined,
        includeReversed: req.query['includeReversed'] !== undefined ? req.query['includeReversed'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
      }).filter(([, value]) => value !== undefined)
    );
}
