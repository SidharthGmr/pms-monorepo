import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import CustomResponse from '@pms/types/src/dto/custom-response';
import { ListResponseDto, ProductVariantListItemDto, ProductVariantResponseDto } from '@pms/types';
import { CreateProductVariantModel, UpdateProductVariantModel } from '../models/product-variant.model';
import { ProductVariantFilterParams } from '../params/product-variant.params';

export class ProductVariantController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  /** Store-wide SKU list. Scoping is derived from the token, never from the query string. */
  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductVariantListItemDto>>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    // `?productIds=12,15,18` - the product list asks for the whole page in one request.
    // An array form (`?productIds=12&productIds=15`) is accepted too; junk is dropped
    // rather than turned into a NaN that Prisma would reject.
    const rawProductIds = req.query['productIds'];
    const productIds = rawProductIds
      ? (Array.isArray(rawProductIds) ? (rawProductIds as string[]) : (rawProductIds as string).split(','))
        .map(Number)
        .filter((n) => Number.isInteger(n))
      : undefined;

    const filters: ProductVariantFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        productId: req.query['productId'] ? parseInt(req.query['productId'] as string) : undefined,
        productIds: productIds && productIds.length > 0 ? productIds : undefined,
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
      name?: string | null;
      images?: string[];
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
      ...(body.name !== undefined && { name: body.name }),
      ...(body.images !== undefined && { images: body.images }),
      // Omit rather than send `{}` so the repository's own default applies.
      ...(body.attributes && Object.keys(body.attributes).length > 0 && { attributes: body.attributes }),
      ...(body.stockQuantity !== undefined && { stockQuantity: body.stockQuantity }),
      ...(body.effectiveFrom && { effectiveFrom: new Date(body.effectiveFrom) }),
      ...(body.supersedePrevious !== undefined && { supersedePrevious: body.supersedePrevious }),
    };

    const variant = await this.unitOfService.ProductVariant.record(model);
    return res.status(201).json({ success: true, message: 'Product variant recorded successfully', data: variant });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<ProductVariantResponseDto>>> => {
    const userId = req.user?.userId as string;
    const storeCode = req.user?.storeCode; // Get from logged-in user
    const id = parseInt(req.params['id'] as string);

    if (!storeCode || !userId) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid variant id' });

    const body = req.body as {
      name?: string | null;
      sku?: string;
      barcode?: string | null;
      attributes?: Record<string, string | number | boolean>;
      images?: string[];
      lowStockThreshold?: number | null;
      isActive?: boolean;
      sellingPrice?: number;
      costPrice?: number | null;
      effectiveFrom?: string | Date;
      stockQuantity?: number | null;
      reason?: string | null;
    };

    const model: UpdateProductVariantModel = {
      updatedById: userId,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sku !== undefined && { sku: body.sku }),
      ...(body.barcode !== undefined && { barcode: body.barcode }),
      ...(body.attributes !== undefined && { attributes: body.attributes }),
      ...(body.images !== undefined && { images: body.images }),
      ...(body.lowStockThreshold !== undefined && { lowStockThreshold: body.lowStockThreshold }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.sellingPrice !== undefined && { sellingPrice: body.sellingPrice }),
      ...(body.costPrice !== undefined && { costPrice: body.costPrice }),
      ...(body.effectiveFrom !== undefined && { effectiveFrom: new Date(body.effectiveFrom) }),
      ...(body.stockQuantity !== undefined && { stockQuantity: body.stockQuantity }),
      ...(body.reason !== undefined && { reason: body.reason }),
    };

    const variant = await this.unitOfService.ProductVariant.update(id, storeCode, model);
    return res.status(200).json({ success: true, message: 'Product variant updated successfully', data: variant });
  };

  /**
   * Public storefront listing - no authentication. Only active variants of Published
   * products are ever returned, so a draft or a retired SKU can never leak.
   */
  getAllPublic = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<ProductVariantListItemDto>>>> => {
    const filters: ProductVariantFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        categoryId: req.query['categoryId'] ? parseInt(req.query['categoryId'] as string) : undefined,
        storeCode: req.query['storeCode'] as string | undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: req.query['sortDirection'] || req.query['sortOrder']
          ? ((req.query['sortDirection'] || req.query['sortOrder']) as string).toLowerCase() === 'asc'
            ? 'asc'
            : 'desc'
          : undefined,
        // Not client-supplied: a shopper only ever sees sellable variants of live products.
        isActive: true,
        publishedOnly: true,
      }).filter(([, v]) => v !== undefined)
    );

    const result = await this.unitOfService.ProductVariant.getAll(filters);
    return res.status(200).json({ success: true, message: 'Product variants fetched successfully', data: result });
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
