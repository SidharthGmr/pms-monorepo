import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateMasterAttributeDto, MasterAttributeDto } from '../dtos/master-entry.dto';
import { MasterAttributeFilterParams } from '../params/master-entry.params';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class MasterAttributeController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<MasterAttributeDto>>>> => {
    const rawDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: MasterAttributeFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as Status) : undefined,
        code: req.query['code'] ? (req.query['code'] as string).toUpperCase() : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: rawDirection ? (rawDirection.toLowerCase() === 'asc' ? 'asc' : 'desc') : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.MasterAttribute.getAll(filters);
    return res.status(200).json({ success: true, message: 'Master attributes fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterAttributeDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.MasterAttribute.getById(id);
    return res.status(200).json({ success: true, message: 'Master attribute fetched successfully', data });
  };

  getByCode = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterAttributeDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const code = (req.params['code'] as string).toUpperCase();
    const data = await this.unitOfService.MasterAttribute.getByCode(code, storeCode);
    return res.status(200).json({ success: true, message: 'Master attribute fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterAttributeDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const data = await this.unitOfService.MasterAttribute.create(req.body as CreateMasterAttributeDto, storeCode);
    return res.status(201).json({ success: true, message: 'Master attribute created successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterAttributeDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.MasterAttribute.update(id, req.body as CreateMasterAttributeDto);
    return res.status(200).json({ success: true, message: 'Master attribute updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterAttributeDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.MasterAttribute.delete(id);
    return res.status(204).json({ success: true, message: 'Master attribute deleted successfully', data });
  };
}
