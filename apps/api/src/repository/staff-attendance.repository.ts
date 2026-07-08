import prisma from "../config/prisma";
import { CreateStaffAttendanceDto, StaffAttendanceDto, UpdateStaffAttendanceDto } from "../dtos/staff-attendance.dto";
import { IStaffAttendanceRepository } from "./interfaces/istaff-attendance.repository";

export class StaffAttendanceRepository implements IStaffAttendanceRepository {
  async findAll(): Promise<StaffAttendanceDto[]> {
    return prisma.staffAttendance.findMany();
  }

  async findByStaffId(staffId: number): Promise<StaffAttendanceDto[]> {
    return prisma.staffAttendance.findMany({ where: { staffId } });
  }

  async findById(id: number): Promise<StaffAttendanceDto | null> {
    return prisma.staffAttendance.findUnique({ where: { id } });
  }

  async create(data: CreateStaffAttendanceDto): Promise<StaffAttendanceDto> {
    return prisma.staffAttendance.create({ data });
  }

  async update(id: number, data: UpdateStaffAttendanceDto): Promise<StaffAttendanceDto> {
    return prisma.staffAttendance.update({ where: { id }, data });
  }

  async delete(id: number): Promise<StaffAttendanceDto> {
    return prisma.staffAttendance.delete({ where: { id } });
  }
}
