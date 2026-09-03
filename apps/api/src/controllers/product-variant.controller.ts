import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import CustomResponse from '@pms/types/src/dto/custom-response';
import { Status } from '@prisma/client';
import {
  ListResponseDto,
  ProductVariantListItemDto,
  ProductVariantModel,
  ProductVariantResponseDto,
  StatusEnum,
} from '@pms/types';
import { ProductVariantFilterParams } from '../params/product-variant.params';
import { VariantRatingDto } from '../dtos/product-variant.dto';

export class ProductVariantController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductVariantListItemDto>>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const filters: ProductVariantFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        productId: req.query['productId'] ? parseInt(req.query['productId'] as string) : undefined,
        categoryId: req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined,
        isActive: req.query['isActive'] !== undefined ? req.query['isActive'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: req.query['sortDirection'] || req.query['sortOrder']
          ? ((req.query['sortDirection'] || req.query['sortOrder']) as string).toLowerCase() === 'asc'
            ? 'asc'
            : 'desc'
          : undefined,
        storeCode,
      }).filter(([, v]) => v !== undefined)
    );

    const result = await this.unitOfService.ProductVariant.getAll(filters);
    return res.status(200).json({ success: true, message: 'Product variants fetched successfully', data: result });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductVariantListItemDto>>> => {
    const storeCode = req.user?.storeCode;
    const id = parseInt(req.params['id'] as string);

    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const variant = await this.unitOfService.ProductVariant.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Product variant fetched successfully', data: variant });
  };

  rate = async (req: Request, res: Response): Promise<Response<CustomResponse<VariantRatingDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode;
    const id = parseInt(req.params['id'] as string);

    if (!storeCode || !userId) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const { rating } = req.body as { rating: number };
    const data = await this.unitOfService.ProductVariant.rate(id, rating, userId, storeCode);
    return res.status(200).json({ success: true, message: 'Rating saved successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductVariantResponseDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode;

    if (!storeCode || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }

    const model = req.body as ProductVariantModel;

    const product = await this.unitOfService.ProductVariant.create(model, userId, storeCode);
    return res.status(201).json({ success: true, message: "Product created successfully", data: product });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductVariantResponseDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode;
    const id = parseInt(req.params['id'] as string);

    if (!storeCode || !userId) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    // The author comes from the token, never the body: the service stamps it on the variant
    // row and on any PriceHistory / stockHistory row the edit files.
    const model = { ...req.body, updatedById: userId } as ProductVariantModel;

    const variant = await this.unitOfService.ProductVariant.update(model, id, storeCode);
    return res.status(200).json({ success: true, message: 'Product variant updated successfully', data: variant });
  };

  getAllPublic = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductVariantListItemDto>>>> => {
    const filters: ProductVariantFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        categoryId: req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined,
        productId: req.query['productId'] ? parseInt(req.query['productId'] as string) : undefined,
        storeCode: req.query['storeCode'] as string | undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: req.query['sortDirection'] || req.query['sortOrder']
          ? ((req.query['sortDirection'] || req.query['sortOrder']) as string).toLowerCase() === 'asc'
            ? 'asc'
            : 'desc'
          : undefined,
        isActive: true,
        publishedOnly: true,
      }).filter(([, v]) => v !== undefined)
    );

    const result = await this.unitOfService.ProductVariant.getAll(filters);
    return res.status(200).json({ success: true, message: 'Product variants fetched successfully', data: result });
  };

  getHistory = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductVariantResponseDto>>>> => {
    const storeCode = req.user?.storeCode;
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
    const storeCode = req.user?.storeCode;
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
