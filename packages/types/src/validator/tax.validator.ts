import { z } from "zod";
import { TaxCategoryEnum } from "../enum/tax.enum";

export const taxFields = z.object({
  name: z.string().min(1, "Tax name is required").max(100, "Name is too long"),
  code: z.string().min(1, "Tax code is required").max(50, "Code is too long"),
  // The column is Decimal(5, 2), so anything above 999.99 fails at the database.
  rate: z
    .number({ error: "Rate is required" })
    .min(0, "Rate must be zero or greater")
    .max(999.99, "Rate is too large"),
  category: z.nativeEnum(TaxCategoryEnum).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const TaxValidator = z.object({
  body: taxFields,
});
