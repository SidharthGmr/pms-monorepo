import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";

import { CustomResponse, ListResponseDto, StoreDto, CreateStoreDto, UpdateStoreDto, StoreFilterParams } from '@pms/types';
import { Role, Status } from "@prisma/client";

export class StoreController {
  constructor(private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StoreDto>>>> => {
    const filters: StoreFilterParams = Object.fromEntries(
      Object.entries({
        page: req.query["page"] ? parseInt(req.query["page"] as string) : undefined,
        recordPerPage: req.query["recordPerPage"] ? parseInt(req.query["recordPerPage"] as string) : undefined,
        search: (req.query["search"] as string) || undefined,
        isActive: req.query["isActive"] ? req.query["isActive"] === "true" : undefined,
        status: (req.query["status"] as Status) || undefined,
        showAllRecords: req.query["showAllRecords"] !== undefined ? req.query["showAllRecords"] === "true" : undefined,
      }).filter(([, v]) => v !== undefined)
    );

    const result = await this.unitOfService.Store.getAll(filters);
    return res.status(200).json({
      success: true,
      message: "Stores fetched successfully",
      data: result,
    });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const store = await this.unitOfService.Store.getById(id);
    return res.status(200).json({ success: true, message: "Store fetched successfully", data: store });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>>> => {
    const body = req.body as CreateStoreDto;
    const store = await this.unitOfService.Store.create(body);
    return res.status(201).json({ success: true, message: "Store created successfully", data: store });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const body = req.body as UpdateStoreDto;

    // A super admin manages every store; an admin only their own, and the code -
    // the tenant key every row hangs off - never changes through this endpoint.
    if (req.user?.role !== Role.SUPER_ADMIN) {
      const existing = await this.unitOfService.Store.getById(id);
      if (!existing || existing.code !== req.user?.storeCode) {
        return res.status(403).json({ success: false, message: "You can only update your own store" });
      }
      delete body.code;
    }

    const store = await this.unitOfService.Store.update(id, body);
    return res.status(200).json({ success: true, message: "Store updated successfully", data: store });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>> | Response> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    await this.unitOfService.Store.delete(id);
    return res.status(204).send();
  };
}
