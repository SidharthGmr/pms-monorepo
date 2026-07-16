import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import CustomResponse from '@pms/types/src/dto/custom-response';
import { ListResponseDto, ProductPriceResponseDto } from '@pms/types';
import { CreateProductPriceModel } from '../models/product-price.model';

export class ProductPriceController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductPriceResponseDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.',
      });
    }

    const body = req.body as {
      productId: number;
      sellingPrice: number;
      costPrice?: number | null;
      effectiveFrom?: string | Date;
      reason?: string | null;
    };

    const model: CreateProductPriceModel = {
      productId: body.productId,
      storeCode,
      sellingPrice: body.sellingPrice,
      costPrice: body.costPrice ?? null,
      reason: body.reason ?? null,
      createdById: userId,
      ...(body.effectiveFrom && { effectiveFrom: new Date(body.effectiveFrom) }),
    };

    const price = await this.unitOfService.ProductPrice.record(model);
    return res.status(201).json({ success: true, message: 'Product price recorded successfully', data: price });
  };

  getHistory = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductPriceResponseDto>>>> => {
    const storeCode = req.user?.storeCode; // Get from logged-in user
    const productId = parseInt(req.params['productId'] as string);

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.',
      });
    }
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const page = req.query['page'] ? parseInt(req.query['page'] as string) : 1;
    const limit = req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : 10;

    const result = await this.unitOfService.ProductPrice.getHistory(productId, storeCode, page, limit);
    return res.status(200).json({ success: true, message: 'Product price history fetched successfully', data: result });
  };

  getEffective = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductPriceResponseDto>>> => {
    const storeCode = req.user?.storeCode; // Get from logged-in user
    const productId = parseInt(req.params['productId'] as string);

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.',
      });
    }
    if (isNaN(productId)) return res.status(400).json({ success: false, message: 'Invalid product id' });

    const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();

    const price = await this.unitOfService.ProductPrice.getEffectiveOn(productId, date);
    if (!price) {
      return res.status(404).json({ success: false, message: 'No price found for the given date' });
    }
    return res.status(200).json({ success: true, message: 'Effective price fetched successfully', data: price });
  };
}
