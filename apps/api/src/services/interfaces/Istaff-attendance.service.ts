import { CreateStaffAttendanceDto, StaffAttendanceDto, UpdateStaffAttendanceDto } from '@pms/types';

export interface IStaffAttendanceService {
  getAll(): Promise<StaffAttendanceDto[]>;
  getByStaffId(staffId: number): Promise<StaffAttendanceDto[]>;
  getById(id: number): Promise<StaffAttendanceDto | null>;
  create(data: CreateStaffAttendanceDto): Promise<StaffAttendanceDto>;
  update(id: number, data: UpdateStaffAttendanceDto): Promise<StaffAttendanceDto>;
  delete(id: number): Promise<StaffAttendanceDto>;
}
