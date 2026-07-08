import { AttendanceStatus } from "@prisma/client";

export interface StaffAttendanceDto {
  id: number;
  staffId: number;
  storeCode: string
  date: Date;
  status: AttendanceStatus;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  overtimeHours?: number | null;
  remarks?: string | null;
  recordedBy?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStaffAttendanceDto {
  staffId: number;
  storeCode: string
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
