import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";

export const categoryValidator = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    parentId: z.number().int().optional(),
    status: z.nativeEnum(StatusEnum).optional(),
    displayOrder: z.number().int().optional(),
  }),
});

