import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import {
  CustomResponse,
  ExpenseDto,
  ExpenseFilterParams,
  ExpenseModel,
  ExpenseStatus,
  ExpenseStatusModel,
  ExpenseSummaryDto,
  ExpenseSummaryParams,
  ListResponseDto,
} from '@pms/types';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class ExpenseController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseDto>>> => {
    const body = req.body as ExpenseModel;
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Expense.create(body, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Expense recorded successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ExpenseDto>>>> => {
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: ExpenseFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as ExpenseStatus) : undefined,
        expenseAccountId: req.query['expenseAccountId'] ? parseInt(req.query['expenseAccountId'] as string) : undefined,
        supplierId: req.query['supplierId'] ? parseInt(req.query['supplierId'] as string) : undefined,
        fromDate: req.query['fromDate'] as string | undefined,
        toDate: req.query['toDate'] as string | undefined,
        isTemplate: req.query['isTemplate'] !== undefined ? req.query['isTemplate'] === 'true' : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.Expense.getAll(filters);
    return res.status(200).json({ success: true, message: 'Expenses fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Expense.getById(id, req.user?.storeCode || undefined);
    return res.status(200).json({ success: true, message: 'Expense fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Expense.update(id, req.body as ExpenseModel, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Expense updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.Expense.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Expense deleted successfully', data });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Expense.updateStatus(id, req.body as ExpenseStatusModel, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Expense status updated successfully', data });
  };

  getSummary = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseSummaryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const filters: ExpenseSummaryParams = Object.fromEntries(
      Object.entries({
        fromDate: req.query['fromDate'] as string | undefined,
        toDate: req.query['toDate'] as string | undefined,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.Expense.getSummary(storeCode, filters);
    return res.status(200).json({ success: true, message: 'Expense summary fetched successfully', data });
  };

  runRecurring = async (req: Request, res: Response): Promise<Response<CustomResponse<ExpenseDto[]>>> => {
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Expense.runRecurring(storeCode, userId);
    return res.status(201).json({ success: true, message: `${data.length} recurring expense(s) generated`, data });
  };
}
