import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";

export const BrandNameValidator = z.object({
  body: z.object({
    name: z.string().min(1, "Brand name is required"),
    images: z.array(z.string()).optional(),
    status: z.nativeEnum(StatusEnum).optional(),
    displayOrder: z.number().int().optional(),
  }),
});
