import { AttendanceStatus } from '../enum/attendance-status.enum';

export interface StaffAttendanceDto {
  id: number;
  staffId: number;
  storeCode: string;
  date: Date | string;
  status: AttendanceStatus;
  checkInTime?: Date | string | null;
  checkOutTime?: Date | string | null;
  overtimeHours?: number | null;
  remarks?: string | null;
  recordedBy?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateStaffAttendanceDto {
  staffId: number;
  storeCode: string;
  date: Date;
  status?: AttendanceStatus;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  overtimeHours?: number | null;
  remarks?: string | null;
  recordedBy?: number | null;
}

export interface UpdateStaffAttendanceDto {
  status?: AttendanceStatus;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  overtimeHours?: number | null;
  remarks?: string | null;
  recordedBy?: number | null;
}
