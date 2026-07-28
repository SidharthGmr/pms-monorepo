import { Status } from '@prisma/client';
import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import CustomResponse from '../dtos/custom-response';
import { ListResponseDto } from '../dtos/list-response.dto';
import { CreateMasterEntryDto, MasterEntryDto } from '../dtos/master-entry.dto';
import { MasterEntryFilterParams } from '../params/master-entry.params';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class MasterEntryController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<MasterEntryDto>>>> => {
    const rawDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: MasterEntryFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] ? (req.query['status'] as Status) : undefined,
        attributeId: req.query['attributeId'] ? parseInt(req.query['attributeId'] as string) : undefined,
        // Uppercased so `?attributeCode=size` works as well as SIZE.
        attributeCode: req.query['attributeCode'] ? (req.query['attributeCode'] as string).toUpperCase() : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode: req.user?.storeCode || undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortOrder: rawDirection ? (rawDirection.toLowerCase() === 'asc' ? 'asc' : 'desc') : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.MasterEntry.getAll(filters);
    return res.status(200).json({ success: true, message: 'Master entries fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterEntryDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const data = await this.unitOfService.MasterEntry.getById(id);
    return res.status(200).json({ success: true, message: 'Master entry fetched successfully', data });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterEntryDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json({ success: false, message: 'Store code not found. User must be associated with a store.' });
    }

    const data = await this.unitOfService.MasterEntry.create(req.body as CreateMasterEntryDto, storeCode);
    return res.status(201).json({ success: true, message: 'Master entry created successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterEntryDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.MasterEntry.update(id, req.body as CreateMasterEntryDto);
    return res.status(200).json({ success: true, message: 'Master entry updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<MasterEntryDto>>> => {
    const id = parseInt(req.params['id'] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'Invalid id' });

    const data = await this.unitOfService.MasterEntry.delete(id);
    return res.status(204).json({ success: true, message: 'Master entry deleted successfully', data });
  };
}
