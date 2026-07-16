import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import IUnitOfService from '../services/interfaces/iunitof.service';
import CustomResponse from '@pms/types/src/dto/custom-response';
import { CategoryFilterParams, CategoryModel, CategoryResponseDto, ListResponseDto } from '@pms/types';

export class CategoryController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<CategoryResponseDto>>>> => {
    const filters: CategoryFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        parentId: req.query['parentId'] ? parseInt(req.query['parentId'] as string) : undefined,
        status: req.query['status'] ? req.query['status'] as Status : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode: req.user?.storeCode || undefined,
      }).filter(([, v]) => v !== undefined)
    );
    const categories = await this.unitOfService.Category.getAll(filters);
    return res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories,
    });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const category = await this.unitOfService.Category.getById(id, storeCode);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    return res.status(200).json({ success: true, message: 'Category fetched successfully', data: category });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const body = req.body as CategoryModel;
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const category = await this.unitOfService.Category.create(body, storeCode);
    return res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const id = parseInt(req.params['id'] as string);

    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const body = req.body as CategoryModel;
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const category = await this.unitOfService.Category.update(id, body, storeCode);
    return res.status(200).json({ success: true, message: 'Category updated successfully', data: category });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<CategoryResponseDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const category = await this.unitOfService.Category.delete(id, storeCode);
    return res.status(200).json({ success: true, status: 204, message: 'Category deleted successfully', data: category });
  };
}
