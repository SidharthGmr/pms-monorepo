import { z } from "zod";
import { Status } from "@prisma/client";

export const createBrandNameSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Brand name is required"),
        images: z.array(z.string()).optional(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional(),
    }),
});

export const updateBrandNameSchema = z.object({
    body: z.object({
        name: z.string().min(1).optional(),
        images: z.array(z.string()).optional(),
        status: z.nativeEnum(Status).optional(),
        displayOrder: z.number().int().optional(),
    }),
});
