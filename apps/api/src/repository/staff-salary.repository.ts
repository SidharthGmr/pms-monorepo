import prisma from "../config/prisma";
import { CreateStaffSalaryDto, StaffSalaryDto, UpdateStaffSalaryDto } from "../dtos/staff-salary.dto";
import { IStaffSalaryRepository } from "./interfaces/istaff-salary.repository";

export class StaffSalaryRepository implements IStaffSalaryRepository {
  async findAll(): Promise<StaffSalaryDto[]> {
    return prisma.staffSalary.findMany();
  }

  async findByStaffId(staffId: number): Promise<StaffSalaryDto[]> {
    return prisma.staffSalary.findMany({ where: { staffId } });
  }

  async findById(id: number): Promise<StaffSalaryDto | null> {
    return prisma.staffSalary.findUnique({ where: { id } });
  }

  async create(data: CreateStaffSalaryDto): Promise<StaffSalaryDto> {
    return prisma.staffSalary.create({ data });
  }

  async update(id: number, data: UpdateStaffSalaryDto): Promise<StaffSalaryDto> {
    return prisma.staffSalary.update({ where: { id }, data });
  }

  async delete(id: number): Promise<StaffSalaryDto> {
    return prisma.staffSalary.delete({ where: { id } });
  }
}
