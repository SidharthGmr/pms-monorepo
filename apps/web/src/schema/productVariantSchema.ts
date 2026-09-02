import { productVariantFields, updateProductVariantFields } from '@pms/types';
import { z } from 'zod';

const variantAttributeRow = z.object({
  code: z.string().default(''),
  value: z.string().default(''),
});

export type VariantAttributeRow = z.infer<typeof variantAttributeRow>;

// Field rules come from the shared API validators, so the form cannot accept what the API
// rejects. `rows` is the form's own composition of the attributes JSON.
const variantFormFields = z.object({
  productId: productVariantFields.shape.productId.optional(),
  name: updateProductVariantFields.shape.name,
  description: updateProductVariantFields.shape.description,
  sku: productVariantFields.shape.sku,
  barcode: updateProductVariantFields.shape.barcode,
  images: productVariantFields.shape.images,
  lowStockThreshold: updateProductVariantFields.shape.lowStockThreshold,
  isActive: updateProductVariantFields.shape.isActive,
  stockQuantity: updateProductVariantFields.shape.stockQuantity,
  sellingPrice: updateProductVariantFields.shape.sellingPrice,
  costPrice: productVariantFields.shape.costPrice,
  offerPrice: productVariantFields.shape.offerPrice,
  isOffer: updateProductVariantFields.shape.isOffer,
  effectiveFrom: z.date().nullable().optional(),
  effectiveTo: z.date().nullable().optional(),
  reason: productVariantFields.shape.reason,
  rows: z.array(variantAttributeRow).default([]),
});

export type VariantFormValues = z.infer<typeof variantFormFields>;

/**
 * `isFirstVariant` decides whether attributes are required: a product's very first variant may
 * stand alone (a book, a bottle), but a later one must be distinguishable from its siblings.
 * `isEdit` relaxes the create-only rules, because the update endpoint cannot move a variant
 * between products and treats price as an optional reprice.
 */
export const getProductVariantSchema = (isFirstVariant: boolean, isEdit = false) =>
  variantFormFields.superRefine((values, ctx) => {
    if (!values.name || !values.name.trim()) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'Variant name is required' });
    }
    if (!values.description || !values.description.trim()) {
      ctx.addIssue({ code: 'custom', path: ['description'], message: 'Description is required' });
    }
    if (!isEdit && values.sellingPrice == null) {
      ctx.addIssue({ code: 'custom', path: ['sellingPrice'], message: 'Selling price is required' });
    }
    if (!isEdit && !values.productId) {
      ctx.addIssue({ code: 'custom', path: ['productId'], message: 'Pick the product this variant belongs to' });
    }

    if (values.isOffer && values.offerPrice == null) {
      ctx.addIssue({ code: 'custom', path: ['offerPrice'], message: 'Set an offer price, or turn the offer off.' });
    }
    if (values.offerPrice != null && values.sellingPrice != null && Number(values.offerPrice) >= Number(values.sellingPrice)) {
      ctx.addIssue({ code: 'custom', path: ['offerPrice'], message: 'The offer price must be lower than the selling price.' });
    }

    // Mirrors the API rule: a period ending at or before it starts matches nothing, so the
    // price would be invisible the moment it is saved.
    if (values.effectiveTo != null && values.effectiveTo <= (values.effectiveFrom ?? new Date())) {
      ctx.addIssue({ code: 'custom', path: ['effectiveTo'], message: 'The end date must be after the start date.' });
    }

    if (isEdit) return;

    const rows = values.rows ?? [];
    if (rows.some((row) => (row.code && !row.value) || (!row.code && row.value))) {
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Each row needs both an attribute and a value.' });
    }
    if (!isFirstVariant && !rows.some((row) => row.code && row.value)) {
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Pick at least one attribute, such as Size = L.' });
    }
    // Two rows sharing a key would silently collapse into one JSON entry.
    const codes = rows.filter((row) => row.code && row.value).map((row) => row.code);
    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Each attribute can only appear once per variant.' });
    }
  });

/** The schema for a brand-new variant that is not its product's first. */
const ProductVariantSchema = getProductVariantSchema(false, false);

export default ProductVariantSchema;

/** Folds the composed rows into the `{ code: value }` JSON the API stores. */
export const rowsToAttributes = (rows: VariantAttributeRow[]): Record<string, string> =>
  rows
    .filter((row) => row.code && row.value)
    .reduce<Record<string, string>>((acc, row) => {
      acc[row.code.toLowerCase()] = row.value;
      return acc;
    }, {});
