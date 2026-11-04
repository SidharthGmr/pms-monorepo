import { z } from "zod";
import { DiscountTypeEnum } from "../enum/discount.enum";
import { StatusEnum } from "../enum/status.enum";
import { TaxTypeEnum } from "../enum/tax.enum";

export const productVariantValidator = z.object({
  productId: z
    .number({ error: "Select a product" })
    .int()
    .positive("Product ID is required"),
  sku: z
    .string()
    .min(1, "SKU cannot be empty")
    .max(100, "SKU is too long")
    .optional(),
  name: z.string().max(150, "Name is too long").optional(),
  description: z.string().optional(),
  barcode: z.string().max(100, "Barcode is too long").nullable().optional(),
  images: z.array(z.string()).min(1, "Add at least one image"),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.nativeEnum(StatusEnum).optional(),
  lowStockThreshold: z
    .number()
    .int("Threshold must be a whole number")
    .nonnegative("Threshold must be zero or greater")
    .nullable()
    .optional(),
  compareAtPrice: z
    .number()
    .nonnegative("Compare-at price must be a non-negative number")
    .nullable()
    .optional(),
  stockQuantity: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock must be zero or greater")
    .optional(),
  sellingPrice: z
    .number({ error: "Selling price is required" })
    .nonnegative("Selling price must be a non-negative number"),
  wholesalePrice: z
    .number()
    .nonnegative("Wholesale price must be a non-negative number")
    .nullable(),
  costPrice: z
    .number()
    .nonnegative("Purchase price must be a non-negative number")
    .nullable(),
  purchaseTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  wholesaleTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  saleTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  taxId: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountTypeEnum).nullable().optional(),
  discountValue: z
    .number()
    .nonnegative("Discount must be zero or greater")
    .nullable()
    .optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  reason: z.string().nullable().optional(),
  isOffer: z.boolean().optional(),
  attributes: z
    .array(
      z.object({
        attributeid: z
          .number({ error: "Pick an attribute" })
          .int()
          .positive("Pick an attribute"),
        attributeValueId: z
          .number({ error: "Pick a value" })
          .int()
          .positive("Pick a value"),
      }),
    )
    .optional(),
});

export const productVariantFields = z.object({
  productId: z
    .number({ error: "Select a product" })
    .int()
    .positive("Product ID is required"),
  sku: z
    .string()
    .min(1, "SKU cannot be empty")
    .max(100, "SKU is too long")
    .optional(),
  name: z.string().max(150, "Name is too long").optional(),
  description: z.string().optional(),
  barcode: z.string().max(100, "Barcode is too long").nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  status: z.nativeEnum(StatusEnum).optional(),
  lowStockThreshold: z
    .number()
    .int("Threshold must be a whole number")
    .nonnegative("Threshold must be zero or greater")
    .nullable()
    .optional(),
  compareAtPrice: z
    .number()
    .nonnegative("Compare-at price must be a non-negative number")
    .nullable()
    .optional(),
  attributes: z
    .array(
      z.object({
        attributeid: z
          .number({ error: "Pick an attribute" })
          .int()
          .positive("Pick an attribute"),
        attributeValueId: z
          .number({ error: "Pick a value" })
          .int()
          .positive("Pick a value"),
      }),
    )
    .optional(),
  images: z.array(z.string()).min(1, "Add at least one image"),
  stockQuantity: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock must be zero or greater")
    .optional(),
  sellingPrice: z
    .number({ error: "Selling price is required" })
    .nonnegative("Selling price must be a non-negative number"),
  wholesalePrice: z
    .number()
    .nonnegative("Wholesale price must be a non-negative number")
    .nullable()
    .optional(),
  costPrice: z
    .number()
    .nonnegative("Purchase price must be a non-negative number")
    .nullable()
    .optional(),
  purchaseTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  wholesaleTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  saleTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  taxId: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountTypeEnum).nullable().optional(),
  discountValue: z
    .number()
    .nonnegative("Discount must be zero or greater")
    .nullable()
    .optional(),
  effectiveFrom: z.coerce.date().optional(),
  effectiveTo: z.coerce.date().nullable().optional(),
  reason: z.string().nullable().optional(),
  isOffer: z.boolean().optional(),
  supersedePrevious: z.boolean().optional(),
});

const periodIsOrdered = (
  values: {
    effectiveFrom?: Date | undefined;
    effectiveTo?: Date | null | undefined;
  },
  ctx: z.RefinementCtx,
) => {
  if (values.effectiveTo == null) return;
  const from = values.effectiveFrom ?? new Date();
  if (values.effectiveTo <= from) {
    ctx.addIssue({
      code: "custom",
      path: ["effectiveTo"],
      message: "The end date must be after the start date.",
    });
  }
};

const taxIsPicked = (
  values: {
    purchaseTaxType?: TaxTypeEnum | null | undefined;
    wholesaleTaxType?: TaxTypeEnum | null | undefined;
    saleTaxType?: TaxTypeEnum | null | undefined;
    taxId?: string | null | undefined;
  },
  ctx: z.RefinementCtx,
) => {
  const anyWithTax = [
    values.purchaseTaxType,
    values.wholesaleTaxType,
    values.saleTaxType,
  ].includes(TaxTypeEnum.WithTax);
  if (anyWithTax && !values.taxId) {
    ctx.addIssue({
      code: "custom",
      path: ["taxId"],
      message: "Select a tax",
    });
  }
};

const discountIsComplete = (
  values: {
    discountType?: DiscountTypeEnum | null | undefined;
    discountValue?: number | null | undefined;
  },
  ctx: z.RefinementCtx,
) => {
  if (values.discountType && values.discountValue == null) {
    ctx.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: "Enter a discount value",
    });
  }
  if (
    values.discountType === DiscountTypeEnum.Percentage &&
    values.discountValue != null &&
    values.discountValue > 100
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: "Percentage cannot exceed 100",
    });
  }
};

/**
 * What the add/edit form binds to. `productVariantValidator` is the API's own shape, where
 * `wholesalePrice`/`costPrice` are nullable but not optional - binding a form to it rejects a
 * submit on a field the offer toggle keeps hidden, with no message anywhere to show for it.
 */
export const productVariantFormFields = productVariantFields.superRefine(
  (values, ctx) => {
    periodIsOrdered(values, ctx);
    taxIsPicked(values, ctx);
    discountIsComplete(values, ctx);
  },
);

export const CreateProductVariantValidator = z.object({
  body: productVariantFormFields,
});

/**
 * Full edit of a variant. Plain columns are written directly; a changed price is appended
 * to the PriceHistory ledger and a changed stock figure is booked as an adjustment movement
 * (the service handles both), so history is never overwritten.
 */
export const updateProductVariantFields = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(150, "Name is too long")
    .optional(),
  description: z.string().min(1, "Description cannot be empty").optional(),
  sku: z
    .string()
    .min(1, "SKU cannot be empty")
    .max(100, "SKU is too long")
    .optional(),
  barcode: z.string().max(100, "Barcode is too long").nullable().optional(),
  attributes: z
    .array(
      z.object({
        attributeid: z
          .number({ error: "Pick an attribute" })
          .int()
          .positive("Pick an attribute"),
        attributeValueId: z
          .number({ error: "Pick a value" })
          .int()
          .positive("Pick a value"),
      }),
    )
    .optional(),
  images: z.array(z.string()).min(1, "Add at least one image").optional(),
  lowStockThreshold: z
    .number()
    .int("Threshold must be a whole number")
    .nonnegative("Threshold must be zero or greater")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
  isOffer: z.boolean().optional(),
  sellingPrice: z
    .number()
    .nonnegative("Selling price must be a non-negative number")
    .optional(),
  wholesalePrice: z
    .number()
    .nonnegative("Wholesale price must be a non-negative number")
    .nullable()
    .optional(),
  costPrice: z
    .number()
    .nonnegative("Purchase price must be a non-negative number")
    .nullable()
    .optional(),
  purchaseTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  wholesaleTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  saleTaxType: z.nativeEnum(TaxTypeEnum).nullable().optional(),
  taxId: z.string().nullable().optional(),
  discountType: z.nativeEnum(DiscountTypeEnum).nullable().optional(),
  discountValue: z
    .number()
    .nonnegative("Discount must be zero or greater")
    .nullable()
    .optional(),
  effectiveFrom: z.coerce.date().optional(),
  /** Ends the repriced period. See the create field - it can leave a variant unpriced. */
  effectiveTo: z.coerce.date().nullable().optional(),
  stockQuantity: z
    .number()
    .int("Stock must be a whole number")
    .nonnegative("Stock must be zero or greater")
    .nullable()
    .optional(),
  reason: z.string().nullable().optional(),
});

export const UpdateProductVariantValidator = z.object({
  body: updateProductVariantFields.superRefine(periodIsOrdered),
});

/**
 * A star rating for one variant. The rater comes from the token and the store from the
 * variant, so the body carries only the score.
 */
export const rateProductVariantFields = z.object({
  // Whole stars only - the column is an Int, so 4.5 would silently truncate.
  rating: z
    .number()
    .int("rating must be a whole number")
    .min(1, "rating must be between 1 and 5")
    .max(5, "rating must be between 1 and 5"),
});

export const RateProductVariantValidator = z.object({
  body: rateProductVariantFields,
});
