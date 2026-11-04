import { Request, Response } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { CustomResponse, ListResponseDto, TaxCategory, TaxDto, TaxFilterParams, TaxModel } from '@pms/types';
import IUnitOfService from '../services/interfaces/iunitof.service';

export class TaxController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) {}

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<TaxDto>>> => {
    const data = await this.unitOfService.Tax.create(req.body as TaxModel);
    return res.status(201).json({ success: true, message: 'Tax created successfully', data });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<TaxDto>>>> => {
    // The client sends `sortDirection`; accept `sortOrder` too rather than silently dropping the sort.
    const rawSortDirection = (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined;

    const filters: TaxFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        category: req.query['category'] ? (req.query['category'] as TaxCategory) : undefined,
        isActive: req.query['isActive'] !== undefined ? req.query['isActive'] === 'true' : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: rawSortDirection,
      }).filter(([, v]) => v !== undefined)
    );

    const data = await this.unitOfService.Tax.getAll(filters);
    return res.status(200).json({ success: true, message: 'Taxes fetched successfully', data });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<TaxDto>>> => {
    const id = req.params['id'] as string;
    const data = await this.unitOfService.Tax.getById(id);
    return res.status(200).json({ success: true, message: 'Tax fetched successfully', data });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<TaxDto>>> => {
    const id = req.params['id'] as string;
    const data = await this.unitOfService.Tax.update(id, req.body as TaxModel);
    return res.status(200).json({ success: true, message: 'Tax updated successfully', data });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<TaxDto>>> => {
    const id = req.params['id'] as string;
    const data = await this.unitOfService.Tax.delete(id);
    return res.status(200).json({ success: true, message: 'Tax deleted successfully', data });
  };
}
