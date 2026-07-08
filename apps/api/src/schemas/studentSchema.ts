import { z } from "zod";

export const CreateStudentSchema = z.object({
  body: z.object({
    schoolId: z.number().min(1, "schoolId is required"),
    userId: z.string().min(1, "userId is required"),
    classId: z.number().min(1, "classId is required"),
    admissionNo: z.string().optional(),
    rollNo: z.number().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
    admissionDate: z.string().optional(),
    isActive: z.boolean().optional(),
    metadata: z.any().optional(),
  }),
});

export const UpdateStudentSchema = z.object({
  body: z.object({
    admissionNo: z.string().optional(),
    rollNo: z.number().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
    admissionDate: z.string().optional(),
    isActive: z.boolean().optional(),
    status: z.boolean().optional(),
    metadata: z.any().optional(),
  }),
});

export const StudentParamsSchema = z.object({
  params: z.object({ id: z.number().min(1, "student Id is required") }),
});
