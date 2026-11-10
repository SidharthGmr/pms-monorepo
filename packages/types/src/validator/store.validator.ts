import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";
import { emailField, gstinField, gstStateCodeField, phoneField, requiredString } from "./fields";

export const storeFields = z.object({
  name: requiredString("Store name is required").min(2, "Store name must be at least 2 characters"),
  code: requiredString("Store code is required").min(2, "Store code must be at least 2 characters"),
  phone: phoneField(false),
  email: emailField("Invalid email format"),
  siteName: z.string().trim().max(100, "Site name must be 100 characters or fewer").optional(),
  gstin: gstinField(),
  stateCode: gstStateCodeField(),
  storeLogo: z.string().trim().max(2048, "Logo URL must be 2048 characters or fewer").optional(),
  isActive: z.boolean().optional(),
  status: z.nativeEnum(StatusEnum).optional(),
});

export const storeValidator = z.object({ body: storeFields });

/** PUT is a partial write, so nothing is required - and `code` is immutable once created. */
export const updateStoreValidator = z.object({ body: storeFields.omit({ code: true }).partial() });

/**
 * What an admin may change about their own store from Settings: contact details and branding.
 * Code, status and isActive stay with the super admin's full edit.
 */
export const myStoreFields = storeFields.pick({
  name: true,
  phone: true,
  email: true,
  siteName: true,
  storeLogo: true,
  gstin: true,
  stateCode: true,
});

export const updateMyStoreValidator = z.object({ body: myStoreFields });
