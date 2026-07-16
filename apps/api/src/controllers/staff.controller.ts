import { Request, Response } from "express";
import { injectable } from "inversify";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import CustomResponse from "../dtos/custom-response";
import { ListResponseDto } from "../dtos/list-response.dto";
import { CreateStaffDto, StaffDto, UpdateStaffDto } from "../dtos/staff.dto";
import { StaffFilterParams } from "../params/staff.params";
import IUnitOfService from "../services/interfaces/iunitof.service";

@injectable()
export class StaffController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) { }

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffDto>>>> => {


    const storeCode = req.user?.storeCode || undefined;
    const filters: StaffFilterParams = {};

    if (req.query.storeId) filters.storeId = parseInt(req.query.storeId as string);
    if (req.query.isActive) filters.isActive = req.query.isActive === "true";
    if (req.query.department) filters.department = req.query.department as string;
    if (req.query.position) filters.position = req.query.position as string;
    if (req.query.storeCode) filters.storeCode = req.query.storeCode as string;
    if (storeCode) filters.storeCode = storeCode;

    const staff = await this.unitOfService.Staff.getAll(filters);
    return res.status(200).json({
      success: true,
      message: "Staff members fetched successfully",
      data: { totalRecord: staff.length, data: staff },
    });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const staff = await this.unitOfService.Staff.getById(id);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    return res.status(200).json({ success: true, message: "Staff fetched successfully", data: staff });
  };

  getByUserId = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffDto>>> => {
    const userId = req.params.userId as string;
    if ((!userId)) return res.status(400).json({ success: false, message: "Invalid userId" });

    const staff = await this.unitOfService.Staff.getByUserId(userId);
    if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

    return res.status(200).json({ success: true, message: "Staff fetched successfully", data: staff });
  };

  getByStoreCode = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffDto>>>> => {
    const storeId = parseInt(req.params["storeCode"] as string);
    const storeCode = req.params["storeCode"] as string;
    if (!storeCode) return res.status(400).json({ success: false, message: "Invalid storeCode" });

    const staff = await this.unitOfService.Staff.getByStoreCode(storeCode);
    return res.status(200).json({
      success: true,
      message: "Staff members fetched successfully",
      data: { totalRecord: staff.length, data: staff },
    });
  };

  getCount = async (req: Request, res: Response): Promise<Response<CustomResponse<{ count: number }>>> => {
    const storeCode = req.user?.storeCode || undefined;
    const filters: StaffFilterParams = {};

    if (req.query.storeId) filters.storeId = parseInt(req.query.storeId as string);
    if (req.query.isActive) filters.isActive = req.query.isActive === "true";
    if (req.query.department) filters.department = req.query.department as string;
    if (req.query.position) filters.position = req.query.position as string;
    if (req.query.storeCode) filters.storeCode = req.query.storeCode as string;
    if (storeCode) filters.storeCode = storeCode;

    const count = await this.unitOfService.Staff.count(filters);
    return res.status(200).json({
      success: true,
      message: "Staff count fetched successfully",
      data: { count },
    });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffDto>>> => {
    const body = req.body as CreateStaffDto;
    const staff = await this.unitOfService.Staff.create(body);
    return res.status(201).json({ success: true, message: "Staff created successfully", data: staff });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const body = req.body as UpdateStaffDto;
    const staff = await this.unitOfService.Staff.update(id, body);
    return res.status(200).json({ success: true, message: "Staff updated successfully", data: staff });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });

    const staff = await this.unitOfService.Staff.delete(id);
    return res.status(200).json({ success: true, message: "Staff deleted successfully", data: staff });
  };
}
