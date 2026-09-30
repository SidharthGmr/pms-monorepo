import { z } from "zod";

const positiveIdArray = z
  .array(
    z
      .number()
      .int("Ids must be whole numbers")
      .positive("Ids must be greater than zero"),
  )
  .nonempty("Send at least one id");

export const addToCartFields = z
  .object({
    storeId: z.number().int().positive().optional(),
    userId: z.string().min(1).nullable().optional(),
    sessionToken: z.string().min(1).nullable().optional(),
    productIds: positiveIdArray.optional(),
    variantIds: positiveIdArray.optional(),
    currency: z
      .string()
      .trim()
      .length(3, "Currency must be a 3-letter code")
      .toUpperCase()
      .optional(),
  })
  .refine(
    (v) => (v.variantIds?.length ?? 0) > 0 || (v.productIds?.length ?? 0) > 0,
    {
      message:
        "Send variantIds (preferred) or productIds as a non-empty array.",
      path: ["variantIds"],
    },
  );

export const updateCartItemFields = z.object({
  storeId: z.number().int().positive().optional(),
  userId: z.string().min(1).nullable().optional(),
  sessionToken: z.string().min(1).nullable().optional(),
  quantity: z
    .number({ error: "Quantity is required" })
    .int("Quantity must be a whole number")
    .nonnegative("Quantity must be 0 or more")
    .max(999, "Quantity must be at most 999"),
});

export const AddToCartValidator = z.object({ body: addToCartFields });
export const UpdateCartItemValidator = z.object({ body: updateCartItemFields });
