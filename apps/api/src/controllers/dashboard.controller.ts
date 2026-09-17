import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { MISSING_STORE_CODE } from '../constants/responses';

export class DashboardController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getSummary = async (req: Request, res: Response): Promise<Response> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json(MISSING_STORE_CODE);
    }
    const data = await this.unitOfService.Dashboard.getSummary(storeCode);
    return res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data,
    });
  };
}
