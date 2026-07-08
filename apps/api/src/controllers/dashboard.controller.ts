import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class DashboardController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getSummary = async (req: Request, res: Response): Promise<Response> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const data = await this.unitOfService.Dashboard.getSummary(storeCode);
    return res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data,
    });
  };
}
