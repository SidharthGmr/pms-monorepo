 
import { z } from "zod";

export const CreateClassSchema = z.object({
  schoolId: z.string().min(1, 'schoolId is required'),
  name: z.string().min(2, "Class name must be at least 2 characters").max(50).trim(),
  capacity: z.number().int().min(0, "Capacity must be at least 0").max(5000).optional().default(0),
  sortOrder: z.number().int().min(0).max(1000).optional().default(0),
  metadata: z.any().optional(),
});

export const UpdateClassSchema = z.object({
  name: z.string().min(2).max(50).trim().optional(),
  capacity: z.number().int().min(1).max(5000).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  metadata: z.any().nullable().optional(),
});

 