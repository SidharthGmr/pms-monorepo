import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { PurchaseResponseDto } from '@pms/types';

export class PurchaseController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) { }

  // An unparseable date is ignored rather than turned into an Invalid Date,
  // which Prisma would reject at query time.
  private parseDate = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<PurchaseResponseDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode;

    if (!storeCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.',
      });
    }
    const result = await this.unitOfService.Purchase.create(req.body, userId, storeCode);
    return res.status(201).json({ success: true, message: 'Purchase created successfully', data: result });
  };

  getAllPurchases = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<PurchaseResponseDto>>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.recordPerPage ? parseInt(req.query.recordPerPage as string) : 10;
    const search = req.query.search as string | undefined;
    const startDate = this.parseDate(req.query.startDate as string | undefined);
    const endDate = this.parseDate(req.query.endDate as string | undefined);
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = (req.query.sortDirection || req.query.sortOrder) as string | undefined;

    const result = await this.unitOfService.Purchase.getAllPurchases(storeCode, page, limit, search, startDate, endDate, sortBy, sortOrder);
    return res.status(200).json({ success: true, message: 'Purchases fetched successfully', data: result });
  };

  getPurchaseById = async (req: Request, res: Response): Promise<Response<CustomResponse<PurchaseResponseDto>>> => {
    const storeCode = req.user?.storeCode;
    const id = parseInt(req.params.id as string);

    if (!storeCode || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid parameters' });
    }

    const result = await this.unitOfService.Purchase.getPurchaseById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Purchase fetched successfully', data: result });
  };
}
