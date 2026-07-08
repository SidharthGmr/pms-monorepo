import { CreateStaffSalaryDto, StaffSalaryDto, UpdateStaffSalaryDto } from "../../dtos/staff-salary.dto";

export interface IStaffSalaryService {
  getAll(): Promise<StaffSalaryDto[]>;
  getByStaffId(staffId: number): Promise<StaffSalaryDto[]>;
  getById(id: number): Promise<StaffSalaryDto | null>;
  create(data: CreateStaffSalaryDto): Promise<StaffSalaryDto>;
  update(id: number, data: UpdateStaffSalaryDto): Promise<StaffSalaryDto>;
  delete(id: number): Promise<StaffSalaryDto>;
}
