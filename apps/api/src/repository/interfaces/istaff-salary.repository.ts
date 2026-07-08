import { CreateStaffSalaryDto, StaffSalaryDto, UpdateStaffSalaryDto } from "../../dtos/staff-salary.dto";

export interface IStaffSalaryRepository {
  findAll(): Promise<StaffSalaryDto[]>;
  findByStaffId(staffId: number): Promise<StaffSalaryDto[]>;
  findById(id: number): Promise<StaffSalaryDto | null>;
  create(data: CreateStaffSalaryDto): Promise<StaffSalaryDto>;
  update(id: number, data: UpdateStaffSalaryDto): Promise<StaffSalaryDto>;
  delete(id: number): Promise<StaffSalaryDto>;
}
