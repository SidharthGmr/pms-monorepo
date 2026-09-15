import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";

export const attributeValidator = z.object({
  body: z.object({
    name: z.string().min(1, "Attribute name is required"),
    unit: z.string().optional(),
    status: z.nativeEnum(StatusEnum).optional(),
    displayOrder: z.number().int().optional(),
  }),
});
