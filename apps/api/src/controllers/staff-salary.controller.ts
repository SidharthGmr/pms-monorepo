import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";

import { CustomResponse, ListResponseDto, CreateStaffSalaryDto, StaffSalaryDto, UpdateStaffSalaryDto } from '@pms/types';
export class StaffSalaryController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffSalaryDto>>>> => {
    // Payroll never crosses the store boundary; a super admin without a store sees all.
    const all = await this.unitOfService.StaffSalary.getAll();
    const storeCode = req.user?.storeCode;
    const salaries = storeCode ? all.filter((row) => row.storeCode === storeCode) : all;
    return res.status(200).json({ success: true, message: "Staff salaries fetched successfully", data: { totalRecord: salaries.length, data: salaries } });
  };

  getByStaffId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffSalaryDto>>>> => {
    const staffId = parseInt(req.params["staffId"] as string);
    if (isNaN(staffId)) return res.status(400).json({ success: false, message: "Invalid staffId" });
    const allForStaff = await this.unitOfService.StaffSalary.getByStaffId(staffId);
    const salaries = req.user?.storeCode ? allForStaff.filter((row) => row.storeCode === req.user?.storeCode) : allForStaff;
    return res.status(200).json({ success: true, message: "Staff salaries fetched successfully", data: { totalRecord: salaries.length, data: salaries } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const salary = await this.unitOfService.StaffSalary.getById(id);
    return res.status(200).json({ success: true, message: "Staff salary fetched successfully", data: salary });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const body = { ...(req.body as CreateStaffSalaryDto), storeCode: req.user?.storeCode } as CreateStaffSalaryDto;
    const salary = await this.unitOfService.StaffSalary.create(body);
    return res.status(201).json({ success: true, message: "Staff salary created successfully", data: salary });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const existingStoreCheck = await this.unitOfService.StaffSalary.getById(id);
    if (req.user?.storeCode && existingStoreCheck && existingStoreCheck.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "This record belongs to another store" });
    }
    const body = req.body as UpdateStaffSalaryDto;
    const salary = await this.unitOfService.StaffSalary.update(id, body);
    return res.status(200).json({ success: true, message: "Staff salary updated successfully", data: salary });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const existingStoreCheck = await this.unitOfService.StaffSalary.getById(id);
    if (req.user?.storeCode && existingStoreCheck && existingStoreCheck.storeCode !== req.user.storeCode) {
      return res.status(403).json({ success: false, message: "This record belongs to another store" });
    }
    const salary = await this.unitOfService.StaffSalary.delete(id);
    return res.status(200).json({ success: true, message: "Staff salary deleted successfully", data: salary });
  };
}
