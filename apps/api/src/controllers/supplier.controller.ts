import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { SupplierDto, CreateSupplierDto } from '../dtos/supplier.dto';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { SupplierFilterParams } from '../params/supplier.params';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class SupplierController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<SupplierDto>>>> => {
    const filters: SupplierFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? req.query['status'] as Status : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        storeCode: req.user?.storeCode || undefined,
      }).filter(([, v]) => v !== undefined)
    );
    const data = await this.unitOfService.Supplier.getAll(filters);
    return res.status(200).json({ success: true, message: 'Suppliers fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<SupplierDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Supplier.getById(id);
    return res.status(200).json({ success: true, message: 'Supplier fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<SupplierDto>>> => {
    const body = req.body as CreateSupplierDto;
    const storeCode = req.user?.storeCode; // Get from logged-in user

    if (!storeCode) {
      return res.status(400).json({
        success: false,
        message: 'Store code not found. User must be associated with a store.'
      });
    }
    const data = await this.unitOfService.Supplier.create(body, storeCode);
    return res.status(201).json({ success: true, message: 'Supplier created successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<SupplierDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const body = req.body as CreateSupplierDto;
    const data = await this.unitOfService.Supplier.update(id, body);
    return res.status(200).json({ success: true, message: 'Supplier updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<SupplierDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.Supplier.delete(id);
    return res.status(204).json({ success: true, message: 'Supplier deleted successfully', data });
  };
}
