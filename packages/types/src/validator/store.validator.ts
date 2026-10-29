import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";
import { phoneField, requiredString } from "./fields";

export const storeFields = z.object({
  name: requiredString("Store name is required").min(2, "Store name must be at least 2 characters"),
  code: requiredString("Store code is required").min(2, "Store code must be at least 2 characters"),
  address: z.string().optional(),
  phone: phoneField(false),
  email: z.union([z.literal(""), z.string().email("Invalid email format")]).optional(),
  isActive: z.boolean().optional(),
  status: z.nativeEnum(StatusEnum).optional(),
});

export const storeValidator = z.object({ body: storeFields });

/** PUT is a partial write, so nothing is required. */
export const updateStoreValidator = z.object({ body: storeFields.partial() });
