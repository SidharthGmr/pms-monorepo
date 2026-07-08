import { inject, injectable } from "inversify";
import { TYPES } from "../config/ioc.types";
import { CreateStaffAttendanceDto, StaffAttendanceDto, UpdateStaffAttendanceDto } from "../dtos/staff-attendance.dto";
import { IStaffAttendanceService } from "./interfaces/Istaff-attendance.service";
import type IUnitOfWork from "../repository/interfaces/iunitofwork.repository";
import NotFoundError from "../exceptions/not-found-error";

@injectable()
export class StaffAttendanceService implements IStaffAttendanceService {
  constructor(@inject(TYPES.IUnitOfWork) private unitOfWork: IUnitOfWork) {}

  async getAll(): Promise<StaffAttendanceDto[]> {
    return this.unitOfWork.StaffAttendance.findAll();
  }

  async getByStaffId(staffId: number): Promise<StaffAttendanceDto[]> {
    return this.unitOfWork.StaffAttendance.findByStaffId(staffId);
  }

  async getById(id: number): Promise<StaffAttendanceDto | null> {
    const record = await this.unitOfWork.StaffAttendance.findById(id);
    if (!record) throw new NotFoundError("Staff attendance record not found");
    return record;
  }

  async create(data: CreateStaffAttendanceDto): Promise<StaffAttendanceDto> {
    return this.unitOfWork.StaffAttendance.create(data);
  }

  async update(id: number, data: UpdateStaffAttendanceDto): Promise<StaffAttendanceDto> {
    const existing = await this.unitOfWork.StaffAttendance.findById(id);
    if (!existing) throw new NotFoundError("Staff attendance record not found");
    return this.unitOfWork.StaffAttendance.update(id, data);
  }

  async delete(id: number): Promise<StaffAttendanceDto> {
    const existing = await this.unitOfWork.StaffAttendance.findById(id);
    if (!existing) throw new NotFoundError("Staff attendance record not found");
    return this.unitOfWork.StaffAttendance.delete(id);
  }
}
