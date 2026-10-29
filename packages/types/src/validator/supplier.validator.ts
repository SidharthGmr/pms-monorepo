import { z } from "zod";
import { StatusEnum } from "../enum/status.enum";
import { optionalNumberField, phoneField, requiredString } from "./fields";

export const supplierFields = z.object({
  name: requiredString("Supplier name is required"),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  phone: phoneField(true),
  address: z.string().nullable().optional(),
  status: z.nativeEnum(StatusEnum),
  displayOrder: optionalNumberField("Display order must be a number").nullable(),
});

export const supplierValidator = z.object({ body: supplierFields });

export const updateSupplierValidator = z.object({ body: supplierFields.partial() });
