import { CategoryFilterParams, CategoryModel, CategoryResponseDto, CustomResponse, ListResponseDto } from '@pms/types';
import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import { MISSING_STORE_CODE, MISSING_USER_ID } from '../constants/responses';

export class CategoryController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(MISSING_USER_ID);

    const body = req.body as CategoryModel;
    const category = await this.unitOfService.Category.create(body, storeCode, userId);
    return res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<CategoryResponseDto>>>> => {
    // Without a storeCode the repository applies no store filter at all, which would list
    // every tenant's categories - so this is a guard, not a convenience.
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const filters: CategoryFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        parentId: req.query['parentId'] ? parseInt(req.query['parentId'] as string) : undefined,
        status: req.query['status'] ? req.query['status'] as Status : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        includeDeleted: req.query['includeDeleted'] !== undefined ? req.query['includeDeleted'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode,
        // The client sends `sortDirection`; accept `sortOrder` too rather than
        // silently dropping the sort, which is how the list ignored it entirely.
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined,
      }).filter(([, v]) => v !== undefined)
    );
    const categories = await this.unitOfService.Category.getAll(filters);
    return res.status(200).json({ success: true, message: 'Categories fetched successfully', data: categories });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const category = await this.unitOfService.Category.getById(id, storeCode);
    return res.status(200).json({ success: true, message: 'Category fetched successfully', data: category });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(MISSING_USER_ID);

    const body = req.body as CategoryModel;
    const category = await this.unitOfService.Category.update(id, body, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json(MISSING_USER_ID);

    const category = await this.unitOfService.Category.delete(id, storeCode, userId);
    return res.status(200).json({ success: true, message: 'Category deleted successfully', data: category });
  };
}
