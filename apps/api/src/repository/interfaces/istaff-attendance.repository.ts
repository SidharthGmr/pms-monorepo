import { CreateStaffAttendanceDto, StaffAttendanceDto, UpdateStaffAttendanceDto } from '@pms/types';

export interface IStaffAttendanceRepository {
  findAll(): Promise<StaffAttendanceDto[]>;
  findByStaffId(staffId: number): Promise<StaffAttendanceDto[]>;
  findById(id: number): Promise<StaffAttendanceDto | null>;
  create(data: CreateStaffAttendanceDto): Promise<StaffAttendanceDto>;
  update(id: number, data: UpdateStaffAttendanceDto): Promise<StaffAttendanceDto>;
  delete(id: number): Promise<StaffAttendanceDto>;
}
