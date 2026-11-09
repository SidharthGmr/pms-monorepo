import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CustomResponse, FinancialYearDto, FinancialYearModel, ListResponseDto, PageFilterParams } from '@pms/types';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class FinancialYearController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<FinancialYearDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.FinancialYear.create(req.body as FinancialYearModel, storeCode);
    return res.status(201).json({ success: true, message: 'Financial year created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<FinancialYearDto>>>> => {
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: PageFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.FinancialYear.getAll(filters);
    return res.status(200).json({ success: true, message: 'Financial years fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<FinancialYearDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.FinancialYear.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Financial year fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<FinancialYearDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.FinancialYear.update(id, req.body as FinancialYearModel, storeCode);
    return res.status(200).json({ success: true, message: 'Financial year updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<FinancialYearDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.FinancialYear.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Financial year deleted successfully', data });
  };

  setClosed = async (req: Request, res: Response): Promise<Response<CustomResponse<FinancialYearDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const isClosed = (req.body as { isClosed?: boolean }).isClosed === true;
    const data = await this.unitOfService.FinancialYear.setClosed(id, isClosed, storeCode, userId);
    return res.status(200).json({ success: true, message: `Financial year ${isClosed ? 'closed' : 'reopened'} successfully`, data });
  };
}
