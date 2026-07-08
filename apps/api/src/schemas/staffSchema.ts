import { z } from "zod";

export const createStaffSchema = z.object({
    body: z.object({
        userId: z.number().int().positive("User ID must be a positive integer"),
        storeId: z.number().int().positive("Store ID must be a positive integer"),
        position: z.string().min(2, "Position must be at least 2 characters").optional().nullable(),
        department: z.string().min(2, "Department must be at least 2 characters").optional().nullable(),
        hireDate: z.string().datetime().optional(),
        salary: z.number().positive("Salary must be positive").optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});

export const updateStaffSchema = z.object({
    body: z.object({
        storeId: z.number().int().positive("Store ID must be a positive integer").optional(),
        position: z.string().min(2, "Position must be at least 2 characters").optional().nullable(),
        department: z.string().min(2, "Department must be at least 2 characters").optional().nullable(),
        hireDate: z.string().datetime().optional(),
        salary: z.number().positive("Salary must be positive").optional().nullable(),
        isActive: z.boolean().optional(),
    }),
});
