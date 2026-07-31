import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { PriceHistoryDto, PriceHistorySummaryDto } from '../dtos/price-history.dto';
import { CreatePriceHistoryModel, UpdatePriceHistoryModel } from '../models/price-history.model';
import { PriceHistoryFilterParams } from '../params/price-history.params';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class PriceHistoryController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<PriceHistoryDto>>>> => {
    const filters: PriceHistoryFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        variantId: req.query['variantId'] ? parseInt(req.query['variantId'] as string) : undefined,
        productId: req.query['productId'] ? parseInt(req.query['productId'] as string) : undefined,
        minPrice: req.query['minPrice'] ? parseFloat(req.query['minPrice'] as string) : undefined,
        maxPrice: req.query['maxPrice'] ? parseFloat(req.query['maxPrice'] as string) : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        // Never client-supplied: the tenant always comes from the token.
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: req.query['sortDirection'] || req.query['sortOrder']
          ? ((req.query['sortDirection'] || req.query['sortOrder']) as string).toLowerCase() === 'asc'
            ? 'asc'
            : 'desc'
          : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.PriceHistory.getAll(filters);
    return res.status(200).json({ success: true, message: 'Price history fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<PriceHistoryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.PriceHistory.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Price history fetched successfully', data });
  };

  getByVariant = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<PriceHistoryDto>>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const variantId = parseInt(req.params['variantId'] as string);
    if (isNaN(variantId)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const page = req.query['page'] ? parseInt(req.query['page'] as string) : 1;
    const limit = req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : 10;

    const data = await this.unitOfService.PriceHistory.getByVariant(variantId, storeCode, page, limit);
    return res.status(200).json({ success: true, message: 'Price history fetched successfully', data });
  };

  getEffective = async (req: Request, res: Response): Promise<Response<CustomResponse<PriceHistoryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const variantId = parseInt(req.params['variantId'] as string);
    if (isNaN(variantId)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
    if (isNaN(date.getTime())) return res.status(400).json({ success: false, message: 'Invalid date' });

    const data = await this.unitOfService.PriceHistory.getEffectiveOn(variantId, date, storeCode);
    if (!data) return res.status(404).json({ success: false, message: 'No price found for the given date' });

    return res.status(200).json({ success: true, message: 'Effective price fetched successfully', data });
  };

  getSummary = async (req: Request, res: Response): Promise<Response<CustomResponse<PriceHistorySummaryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const variantId = parseInt(req.params['variantId'] as string);
    if (isNaN(variantId)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const data = await this.unitOfService.PriceHistory.getSummary(variantId, storeCode);
    return res.status(200).json({ success: true, message: 'Price history summary fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<PriceHistoryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not identified on the request token.' });
    }

    const body = req.body as {
      variantId: number;
      sellingPrice: number;
      costPrice?: number | null;
      compareAtPrice?: number | null;
      effectiveFrom?: string | Date;
      reason?: string | null;
    };

    const model: CreatePriceHistoryModel = {
      variantId: body.variantId,
      // Tenancy and authorship come from the token, never from the body.
      storeCode,
      sellingPrice: body.sellingPrice,
      costPrice: body.costPrice ?? null,
      compareAtPrice: body.compareAtPrice ?? null,
      reason: body.reason ?? null,
      createdById: userId,
      ...(body.effectiveFrom && { effectiveFrom: new Date(body.effectiveFrom) }),
    };

    const data = await this.unitOfService.PriceHistory.create(model, storeCode);
    return res.status(201).json({ success: true, message: 'Price history recorded successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<PriceHistoryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const body = req.body as {
      sellingPrice?: number;
      costPrice?: number | null;
      effectiveFrom?: string | Date;
      reason?: string | null;
    };

    const model: UpdatePriceHistoryModel = {
      ...(body.sellingPrice !== undefined && { sellingPrice: body.sellingPrice }),
      ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
      ...(body.effectiveFrom !== undefined && { effectiveFrom: new Date(body.effectiveFrom) }),
      ...(body.reason !== undefined && { reason: body.reason }),
    };

    const data = await this.unitOfService.PriceHistory.update(id, model, storeCode);
    return res.status(200).json({ success: true, message: 'Price history updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<PriceHistoryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.PriceHistory.delete(id, storeCode);
    return res.status(200).json({ success: true, message: 'Price history deleted successfully', data });
  };
}
