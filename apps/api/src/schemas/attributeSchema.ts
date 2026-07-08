import { z } from "zod";

export const createAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    unit: z.string().optional(),
  }),
});

export const updateAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    unit: z.string().optional(),
  }),
});
