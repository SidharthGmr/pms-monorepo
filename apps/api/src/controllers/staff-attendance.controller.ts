import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";

import { CustomResponse, ListResponseDto, CreateStaffAttendanceDto, StaffAttendanceDto, UpdateStaffAttendanceDto } from '@pms/types';
export class StaffAttendanceController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffAttendanceDto>>>> => {
    // Attendance stays inside the store; a super admin without a store sees all.
    const all = await this.unitOfService.StaffAttendance.getAll();
    const storeCode = req.user?.storeCode;
    const records = storeCode ? all.filter((row) => row.storeCode === storeCode) : all;
    return res.status(200).json({ success: true, message: "Staff attendance records fetched successfully", data: { totalRecord: records.length, data: records } });
  };

  getByStaffId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffAttendanceDto>>>> => {
    const staffId = parseInt(req.params["staffId"] as string);
    if (isNaN(staffId)) return res.status(400).json({ success: false, message: "Invalid staffId" });
    const allForStaff = await this.unitOfService.StaffAttendance.getByStaffId(staffId);
    const records = req.user?.storeCode ? allForStaff.filter((row) => row.storeCode === req.user?.storeCode) : allForStaff;
    return res.status(200).json({ success: true, message: "Staff attendance records fetched successfully", data: { totalRecord: records.length, data: records } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffAttendanceDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const record = await this.unitOfService.StaffAttendance.getById(id);
    return res.status(200).json({ success: true, message: "Staff attendance record fetched successfully", data: record });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffAttendanceDto>>> => {
    const body = { ...(req.body as CreateStaffAttendanceDto), storeCode: req.user?.storeCode } as CreateStaffAttendanceDto;
    const record = await this.unitOfService.StaffAttendance.create(body);
    return res.status(201).json({ success: true, message: "Staff attendance record created successfully", data: record });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffAttendanceDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const existingStoreCheck = await this.unitOfService.StaffAttendance.getById(id);
    if (req.user?.storeCode && existingStoreCheck && existingStoreCheck.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "This record belongs to another store" });
    }
    const body = req.body as UpdateStaffAttendanceDto;
    const record = await this.unitOfService.StaffAttendance.update(id, body);
    return res.status(200).json({ success: true, message: "Staff attendance record updated successfully", data: record });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffAttendanceDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const existingStoreCheck = await this.unitOfService.StaffAttendance.getById(id);
    if (req.user?.storeCode && existingStoreCheck && existingStoreCheck.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "This record belongs to another store" });
    }
    const record = await this.unitOfService.StaffAttendance.delete(id);
    return res.status(200).json({ success: true, message: "Staff attendance record deleted successfully", data: record });
  };
}
