export interface CreateStaffAttendanceModel {
  staffId: number;
  date: string;
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  overtimeHours?: number;
  remarks?: string;
  recordedBy?: number;
}

export interface UpdateStaffAttendanceModel {
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  overtimeHours?: number;
  remarks?: string;
  recordedBy?: number;
}
