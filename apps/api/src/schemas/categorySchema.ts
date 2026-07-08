import { z } from "zod";
import { Status } from "@prisma/client";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    parentId: z.number().int().optional(),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    parentId: z.number().int().positive().optional(),
    status: z.nativeEnum(Status).optional(),
    displayOrder: z.number().int().optional(),
  }),
});
