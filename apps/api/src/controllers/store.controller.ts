import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";

import { CustomResponse, ListResponseDto, StoreDto, CreateStoreDto, UpdateMyStoreModel, UpdateStoreDto, StoreFilterParams } from '@pms/types';
import { Status } from "@prisma/client";
import { MISSING_STORE_CODE } from "../constants/responses";

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

    // The code - the tenant key every row hangs off - is immutable: UpdateStoreDto
    // doesn't carry it and the service never writes it, whatever the caller sends.
    // The route is super-admin-only; admins edit their own store via /stores/my-store.
    const body = req.body as UpdateStoreDto;

    const store = await this.unitOfService.Store.update(id, body);
    return res.status(200).json({ success: true, message: "Store updated successfully", data: store });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>> | Response> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    await this.unitOfService.Store.delete(id);
    return res.status(204).send();
  };

  // The caller's own store, resolved from the JWT - how the web reads its branding
  // (siteName, storeLogo) without needing to know its numeric id.
  getMyStore = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const store = await this.unitOfService.Store.getByCode(storeCode);
    if (!store) return res.status(404).json({ success: false, message: "Store not found" });

    return res.status(200).json({ success: true, message: "Store fetched successfully", data: store });
  };

  // Admin self-service: updates only the contact/branding slice of the caller's own store.
  updateMyStore = async (req: Request, res: Response): Promise<Response<CustomResponse<StoreDto>>> => {
    const storeCode = req.user?.storeCode;
    if (!storeCode) return res.status(400).json(MISSING_STORE_CODE);

    const body = req.body as UpdateMyStoreModel;
    const store = await this.unitOfService.Store.updateMyStore(storeCode, body);

    return res.status(200).json({ success: true, message: "Store updated successfully", data: store });
  };
}
