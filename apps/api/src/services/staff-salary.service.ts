import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { CreateStaffSalaryDto, StaffSalaryDto, UpdateStaffSalaryDto } from "../dtos/staff-salary.dto";
import { IStaffSalaryService } from "./interfaces/Istaff-salary.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import NotFoundError from "../exceptions/not-found-error";

@injectable()
export class StaffSalaryService implements IStaffSalaryService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async getAll(): Promise<StaffSalaryDto[]> {
    return this.unitOfWork.StaffSalary.findAll();
  }

  async getByStaffId(staffId: number): Promise<StaffSalaryDto[]> {
    return this.unitOfWork.StaffSalary.findByStaffId(staffId);
  }

  async getById(id: number): Promise<StaffSalaryDto | null> {
    const salary = await this.unitOfWork.StaffSalary.findById(id);
    if (!salary) throw new NotFoundError("Staff salary record not found");
    return salary;
  }

  async create(data: CreateStaffSalaryDto): Promise<StaffSalaryDto> {
    return this.unitOfWork.StaffSalary.create(data);
  }

  async update(id: number, data: UpdateStaffSalaryDto): Promise<StaffSalaryDto> {
    const existing = await this.unitOfWork.StaffSalary.findById(id);
    if (!existing) throw new NotFoundError("Staff salary record not found");
    return this.unitOfWork.StaffSalary.update(id, data);
  }

  async delete(id: number): Promise<StaffSalaryDto> {
    const existing = await this.unitOfWork.StaffSalary.findById(id);
    if (!existing) throw new NotFoundError("Staff salary record not found");
    return this.unitOfWork.StaffSalary.delete(id);
  }
}
