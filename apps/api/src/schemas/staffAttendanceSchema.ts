import { z } from "zod";

const AttendanceStatusEnum = z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE", "HALF_DAY"]);

export const createStaffAttendanceSchema = z.object({
  body: z.object({
    staffId: z.number().int().positive("Staff ID is required"),
    date: z.string().min(1, "Date is required"),
    status: AttendanceStatusEnum.optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    overtimeHours: z.number().nonnegative().optional(),
    remarks: z.string().optional(),
    recordedBy: z.number().int().positive().optional(),
  }),
});

export const updateStaffAttendanceSchema = z.object({
  body: z.object({
    status: AttendanceStatusEnum.optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    overtimeHours: z.number().nonnegative().optional(),
    remarks: z.string().optional(),
    recordedBy: z.number().int().positive().optional(),
  }),
});
