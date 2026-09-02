import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { BrandNameDto, CreateBrandNameDto } from '../dtos/brand-name.dto';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { BrandNameFilterParams } from '../params/brand-name.params';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { CreateBrandModel } from '@pms/types';

export class BrandNameController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<BrandNameDto>>>> => {
    const rawCategoryIds = req.query['categoryIds'];
    const categoryIds = rawCategoryIds
      ? (Array.isArray(rawCategoryIds) ? rawCategoryIds : (rawCategoryIds as string).split(','))
        .map(Number).filter(n => !isNaN(n))
      : undefined;

    // The client sends `sortDirection`; accept `sortOrder` too rather than silently
    // dropping the sort, which is how the list ended up ignoring it entirely.
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: BrandNameFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? req.query['status'] as Status : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        categoryIds: categoryIds && categoryIds.length > 0 ? categoryIds : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: rawSortDirection ? (rawSortDirection.toLowerCase() === 'asc' ? 'asc' : 'desc') : undefined,
      }).filter(([, v]) => v !== undefined)
    );
    const data = await this.unitOfService.BrandName.getAll(filters);
    return res.status(200).json({ success: true, message: 'Brand names fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<BrandNameDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.BrandName.getById(id);
    return res.status(200).json({ success: true, message: 'Brand name fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<BrandNameDto>>> => {
    const body = req.body as CreateBrandModel;
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const data = await this.unitOfService.BrandName.create(body, storeCode);
    return res.status(201).json({ success: true, message: 'Brand name created successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<BrandNameDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const body = req.body as CreateBrandModel;
    const data = await this.unitOfService.BrandName.update(id, body);
    return res.status(200).json({ success: true, message: 'Brand name updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<BrandNameDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.BrandName.delete(id);
    return res.status(204).json({ success: true, message: 'Brand name deleted successfully', data });
  };
}
