import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";

export const categoryValidator = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().nullable().optional(),
    parentId: z.number().int().positive().nullable().optional(),
    status: z.nativeEnum(StatusEnum).optional(),
    displayOrder: z.number().int().min(0).optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  }),
});
