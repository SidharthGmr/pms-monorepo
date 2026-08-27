import { productVariantFields, updateProductVariantFields } from '@pms/types';
import { z } from 'zod';

/** One "attribute = value" pair being composed in the form. */
const variantAttributeRow = z.object({
  /** Master attribute code, e.g. "SIZE" — becomes the key in the attributes JSON. */
  code: z.string().default(''),
  /** Master entry value, e.g. "L". */
  value: z.string().default(''),
});

export type VariantAttributeRow = z.infer<typeof variantAttributeRow>;

/**
 * Field rules come from the shared API validators so the form can never accept what the
 * API rejects. `rows` is the form's own composition of the `attributes` JSON, so it is
 * declared here. Everything is optional at the type level; which fields are required is
 * decided by the factory below.
 */
const variantFormFields = z.object({
  /**
   * The variant is created against a product the user picks, since this screen is store-wide
   * rather than nested under a product. Optional here and required by the factory on create;
   * the update endpoint cannot move a variant between products, so edit ignores it.
   */
  productId: productVariantFields.shape.productId.optional(),
  name: updateProductVariantFields.shape.name,
  sku: productVariantFields.shape.sku,
  barcode: updateProductVariantFields.shape.barcode,
  images: productVariantFields.shape.images,
  lowStockThreshold: updateProductVariantFields.shape.lowStockThreshold,
  isActive: updateProductVariantFields.shape.isActive,
  stockQuantity: updateProductVariantFields.shape.stockQuantity,
  sellingPrice: updateProductVariantFields.shape.sellingPrice,
  costPrice: productVariantFields.shape.costPrice,
  effectiveFrom: z.date().nullable().optional(),
  reason: productVariantFields.shape.reason,
  rows: z.array(variantAttributeRow).default([]),
});

export type VariantFormValues = z.infer<typeof variantFormFields>;

/**
 * `isFirstVariant` decides whether attributes are required: a product's very first variant
 * may stand alone (a book, a bottle), but any later one must be distinguishable, so it needs
 * at least one attribute. `isEdit` relaxes the create-only rules (price required, attribute
 * rules) because editing only touches the variant's safe metadata.
 */
export const getProductVariantSchema = (isFirstVariant: boolean, isEdit = false) =>
  variantFormFields.superRefine((values, ctx) => {
    if (!isEdit && values.sellingPrice == null) {
      ctx.addIssue({ code: 'custom', path: ['sellingPrice'], message: 'Selling price is required' });
    }
    if (!isEdit && !values.productId) {
      ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Pick the product this variant belongs to' });
    }
    if (isEdit) return;

    const rows = values.rows ?? [];
    // Half-filled rows would be dropped silently, taking the user's intent with them.
    if (rows.some((row) => (row.code && !row.value) || (!row.code && row.value))) {
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Each row needs both an attribute and a value.' });
    }
    // A first variant may stand alone; a later one must be told apart from its siblings.
    if (!isFirstVariant && !rows.some((row) => row.code && row.value)) {
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Pick at least one attribute, such as Size = L.' });
    }
    // Two rows sharing a key would silently collapse into one JSON entry.
    const codes = rows.filter((row) => row.code && row.value).map((row) => row.code);
    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Each attribute can only appear once per variant.' });
    }
  });

/** Folds the composed rows into the `{ code: value }` JSON the API stores. */
export const rowsToAttributes = (rows: VariantAttributeRow[]): Record<string, string> =>
  rows
    .filter((row) => row.code && row.value)
    .reduce<Record<string, string>>((acc, row) => {
      acc[row.code.toLowerCase()] = row.value;
      return acc;
    }, {});
