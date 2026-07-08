import { Request, Response } from "express";
import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import IUnitOfService from "../services/interfaces/iunitof.service";
import CustomResponse from "../dtos/custom-response";
import { CreateStaffSalaryDto, StaffSalaryDto, UpdateStaffSalaryDto } from "../dtos/staff-salary.dto";
import { ListResponseDto } from "../dtos/list-response.dto";

export class StaffSalaryController {
  constructor(
    private unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService)
  ) {}

  getAll = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffSalaryDto>>>> => {
    const salaries = await this.unitOfService.StaffSalary.getAll();
    return res.status(200).json({ success: true, message: "Staff salaries fetched successfully", data: { totalRecord: salaries.length, data: salaries } });
  };

  getByStaffId = async (req: Request, res: Response): Promise<Response<CustomResponse<ListResponseDto<StaffSalaryDto>>>> => {
    const staffId = parseInt(req.params["staffId"] as string);
    if (isNaN(staffId)) return res.status(400).json({ success: false, message: "Invalid staffId" });
    const salaries = await this.unitOfService.StaffSalary.getByStaffId(staffId);
    return res.status(200).json({ success: true, message: "Staff salaries fetched successfully", data: { totalRecord: salaries.length, data: salaries } });
  };

  getById = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const salary = await this.unitOfService.StaffSalary.getById(id);
    return res.status(200).json({ success: true, message: "Staff salary fetched successfully", data: salary });
  };

  create = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const body = req.body as CreateStaffSalaryDto;
    const salary = await this.unitOfService.StaffSalary.create(body);
    return res.status(201).json({ success: true, message: "Staff salary created successfully", data: salary });
  };

  update = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const body = req.body as UpdateStaffSalaryDto;
    const salary = await this.unitOfService.StaffSalary.update(id, body);
    return res.status(200).json({ success: true, message: "Staff salary updated successfully", data: salary });
  };

  delete = async (req: Request, res: Response): Promise<Response<CustomResponse<StaffSalaryDto>>> => {
    const id = parseInt(req.params["id"] as string);
    if (isNaN(id)) return res.status(400).json({ success: false, message: "Invalid id" });
    const salary = await this.unitOfService.StaffSalary.delete(id);
    return res.status(200).json({ success: true, message: "Staff salary deleted successfully", data: salary });
  };
}
