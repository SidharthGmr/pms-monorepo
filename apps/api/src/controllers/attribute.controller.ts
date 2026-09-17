import { AttributeDto, AttributeFilterParams, AttributeModel, CustomResponse, ListResponseDto, StatusEnum } from "@pms/types";
import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";
import { MISSING_STORE_CODE } from '../constants/responses';

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
    const filters: AttributeFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query['page'] ? parseInt(req.query['page'] as string) : undefined,
        recordPerPage: req.query['recordPerPage'] ? parseInt(req.query['recordPerPage'] as string) : undefined,
        search: req.query['search'] as string | undefined,
        status: req.query['status'] !== undefined && req.query['status'] !== '' && Object.values(StatusEnum).includes(req.query['status'] as StatusEnum) ? (req.query['status'] as StatusEnum) : undefined,
        showAllRecords: req.query['showAllRecords'] !== undefined ? req.query['showAllRecords'] === 'true' : undefined,
        startDate: req.query['startDate'] ? new Date(req.query['startDate'] as string) : undefined,
        endDate: req.query['endDate'] ? new Date(req.query['endDate'] as string) : undefined,
        storeCode: req.user?.storeCode || undefined,
      }).filter(([, v]) => v !== undefined)
    );
    const result = await this.unitOfService.Attribute.getAll(filters);
    return res.status(200).json({ success: true, message: "Attributes fetched successfully", data: { totalRecord: result.totalRecord, data: result.data } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const attribute = await this.unitOfService.Attribute.getById(id);
    return res.status(200).json({ success: true, message: "Attribute fetched successfully", data: attribute });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const body = req.body as AttributeModel;
    const attribute = await this.unitOfService.Attribute.update(id, body);
    return res.status(200).json({ success: true, message: "Attribute updated successfully", data: attribute });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<AttributeDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const attribute = await this.unitOfService.Attribute.delete(id);
    return res.status(204).json({ success: true, message: "Attribute deleted successfully", data: attribute });
  };
}
