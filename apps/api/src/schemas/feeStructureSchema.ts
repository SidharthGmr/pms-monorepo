
import { z } from 'zod';

export const createFeeStructureSchema = z.object({
    body: z.object({
        schoolId: z.string().min(1),
        classId: z.string().min(1),
        feeHeadId: z.string().min(1),
        routeId: z.string().nullable().optional(),
        amount: z.number().positive(),
        isActive: z.boolean().default(true).optional(),
        metadata: z.any().optional(),
    }),
});

export const updateFeeStructureSchema = z.object({
    body: z.object({
        classId: z.string().min(1).optional(),
        feeHeadId: z.string().min(1).optional(),
        routeId: z.string().nullable().optional(),
        amount: z.number().positive().optional(),
        isActive: z.boolean().optional(),
        metadata: z.any().optional(),
    }),
});

export const feeStructureIdSchema = z.object({
    params: z.object({ feeStructureId: z.string().min(1) }),
});