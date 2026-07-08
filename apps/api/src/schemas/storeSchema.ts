import { z } from "zod";

// Schema for creating a store
export const createStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Store name must be at least 2 characters"),
    code: z.string().min(2, "Store code must be at least 2 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    status: z.enum(["Published", "Draft", "Trash"]).optional(),
  }),
});

// Schema for updating a store
export const updateStoreSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Store name must be at least 2 characters").optional(),
    code: z.string().min(2, "Store code must be at least 2 characters").optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
    status: z.enum(["Published", "Draft", "Trash"]).optional(),
  }),
});
