import { z } from "zod";
import { Status } from "@prisma/client";

export const createSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Supplier name is required"),
        email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional(),
    }),
});

export const updateSupplierSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
        phone: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional(),
    }),
});
