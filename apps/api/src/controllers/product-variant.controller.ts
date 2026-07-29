import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import CustomResponse from '@pms/types/src/dto/custom-response';
import { ListResponseDto, ProductVariantResponseDto } from '@pms/types';
import { CreateProductVariantModel } from '../models/product-variant.model';

export class ProductVariantController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductVariantResponseDto>>> => {
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
      sku?: string;
      attributes?: Record<string, string | number | boolean>;
      stockQuantity?: number;
      sellingPrice: number;
      costPrice?: number | null;
      effectiveFrom?: string | Date;
      reason?: string | null;
      supersedePrevious?: boolean;
    };

    const model: CreateProductVariantModel = {
      productId: body.productId,
      storeCode,
      sellingPrice: body.sellingPrice,
      costPrice: body.costPrice ?? null,
      reason: body.reason ?? null,
      createdById: userId,
      ...(body.sku && { sku: body.sku }),
      // Omit rather than send `{}` so the repository's own default applies.
      ...(body.attributes && Object.keys(body.attributes).length > 0 && { attributes: body.attributes }),
      ...(body.stockQuantity !== undefined && { stockQuantity: body.stockQuantity }),
      ...(body.effectiveFrom && { effectiveFrom: new Date(body.effectiveFrom) }),
      ...(body.supersedePrevious !== undefined && { supersedePrevious: body.supersedePrevious }),
    };

    const variant = await this.unitOfService.ProductVariant.record(model);
    return res.status(201).json({ success: true, message: 'Product variant recorded successfully', data: variant });
  };

  getHistory = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductVariantResponseDto>>>> => {
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

    const result = await this.unitOfService.ProductVariant.getHistory(productId, storeCode, page, limit);
    return res.status(200).json({ success: true, message: 'Product variant history fetched successfully', data: result });
  };

  getEffective = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductVariantResponseDto>>> => {
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

    const variant = await this.unitOfService.ProductVariant.getEffectiveOn(productId, date);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'No variant found for the given date' });
    }
    return res.status(200).json({ success: true, message: 'Effective variant fetched successfully', data: variant });
  };
}
