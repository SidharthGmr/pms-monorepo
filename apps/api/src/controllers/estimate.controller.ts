import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import {
  CustomResponse,
  EstimateDto,
  EstimateFilterParams,
  EstimateModel,
  EstimateStatus,
  EstimateConvertModel,
  EstimateStatusModel,
  ListResponseDto,
  OrderDto,
  ShareLinkDto,
} from '@pms/types';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class EstimateController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  convert = async (req: Request, res: Response): Promise<Response<CustomResponse<OrderDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Estimate.convert(id, req.body as EstimateConvertModel, storeCode, userId, req.user?.name ?? '');
    return res.status(201).json({ success: true, message: 'Estimate converted to a sale', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const body = req.body as EstimateModel;
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Estimate.create(body, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Estimate created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<EstimateDto>>>> => {
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: EstimateFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as EstimateStatus) : undefined,
        customerId: req.query['customerId'] as string | undefined,
        startDate: req.query['startDate'] as string | undefined,
        endDate: req.query['endDate'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, value]) => value !== undefined)
    );

    const data = await this.unitOfService.Estimate.getAll(filters);
    return res.status(200).json({ success: true, message: 'Estimates fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Estimate.getById(id, req.user?.storeCode || undefined);
    return res.status(200).json({ success: true, message: 'Estimate fetched successfully', data });
  };

  getByNumber = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const estimateNumber = (req.params['estimateNumber'] as string)?.trim();
    if (!estimateNumber) return res.status(400).json({ success: false, message: 'Invalid estimate number' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.Estimate.getByNumber(estimateNumber, storeCode);
    return res.status(200).json({ success: true, message: 'Estimate fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Estimate.update(id, req.body as EstimateModel, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Estimate updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.Estimate.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Estimate deleted successfully', data });
  };

  updateStatus = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Estimate.updateStatus(id, req.body as EstimateStatusModel, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Estimate status updated successfully', data });
  };

  share = async (req: Request, res: Response): Promise<Response<CustomResponse<ShareLinkDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    const data = await this.unitOfService.Estimate.createShareLink(id, storeCode);
    return res.status(200).json({ success: true, message: 'Share link ready', data });
  };

  duplicate = async (req: Request, res: Response): Promise<Response<CustomResponse<EstimateDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode;
    const userId = req.user?.userId;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);
    if (!userId) return res.status(401).json(MISSING_USER_ID);
    const data = await this.unitOfService.Estimate.duplicate(id, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Estimate duplicated successfully', data });
  };
}
