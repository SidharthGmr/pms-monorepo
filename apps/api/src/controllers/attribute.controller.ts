import { AttributeDto, AttributeFilterParams, AttributeModel, CustomResponse, ListResponseDto } from "@pms/types";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";
import { MISSING_STORE_CODE } from '../constants/responses';
import { parseStatusQuery } from '../utils/status-query';

export class AttributeController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) { }

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const body = req.body as AttributeModel;
    const storeCode = req.user?.storeCode;
    if (!storeCode) {
      return res.status(400).json(MISSING_STORE_CODE);
    }
    const attribute = await this.unitOfService.Attribute.create(body, storeCode);
    return res.status(201).json({ success: true, message: 'Attribute created successfully', data: attribute });
  };

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<AttributeDto>>>> => {
    // Without a storeCode the repository applies no store filter at all, which would list
    // every tenant's attributes - so this is a guard, not a convenience.
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const filters: AttributeFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: parseStatusQuery(req.query['status']),
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode,
        sortBy: req.query['sortBy'] as string | undefined,
        sortDirection: (req.query['sortDirection'] || req.query['sortOrder']) as string | undefined,
      }).filter(([, v]) => v !== undefined)
    );
    const result = await this.unitOfService.Attribute.getAll(filters);
    return res.status(200).json({ success: true, message: "Attributes fetched successfully", data: { totalRecord: result.totalRecord, data: result.data } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const attribute = await this.unitOfService.Attribute.getById(id, storeCode);
    return res.status(200).json({ success: true, message: "Attribute fetched successfully", data: attribute });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const body = req.body as Partial<AttributeModel>;
    const attribute = await this.unitOfService.Attribute.update(id, body, storeCode);
    return res.status(200).json({ success: true, message: "Attribute updated successfully", data: attribute });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    // 200 with the trashed row, the same as category. A 204 made Express drop the body.
    const attribute = await this.unitOfService.Attribute.delete(id, storeCode);
    return res.status(200).json({ success: true, message: "Attribute deleted successfully", data: attribute });
  };
}
