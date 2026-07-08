import { CreateStaffAttendanceDto, StaffAttendanceDto, UpdateStaffAttendanceDto } from "../../dtos/staff-attendance.dto";

export interface IStaffAttendanceService {
  getAll(): Promise<StaffAttendanceDto[]>;
  getByStaffId(staffId: number): Promise<StaffAttendanceDto[]>;
  getById(id: number): Promise<StaffAttendanceDto | null>;
  create(data: CreateStaffAttendanceDto): Promise<StaffAttendanceDto>;
  update(id: number, data: UpdateStaffAttendanceDto): Promise<StaffAttendanceDto>;
  delete(id: number): Promise<StaffAttendanceDto>;
}
