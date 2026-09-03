import { MasterAttributeDto, MasterEntryDto } from '@/dtos/master-entry.dto';
import { productVariantFields, updateProductVariantFields, variantAttributeFields } from '@pms/types';
import { z } from 'zod';

const variantAttributeRow = z.object({
  attributeid: z.number().int().positive().nullable().default(null),
  attributeValueId: z.number().int().positive().nullable().default(null),
});

export type VariantAttributeRow = z.infer<typeof variantAttributeRow>;

export const emptyAttributeRow: VariantAttributeRow = { attributeid: null, attributeValueId: null };

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
  attributes: z.array(variantAttributeRow).default([]),
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

    const rows = values.attributes ?? [];

    // A half-picked row is flagged on the dropdown that still needs an answer, not on the
    // array, so the message lands next to the field that has to change.
    rows.forEach((row, index) => {
      if (row.attributeid && !row.attributeValueId) {
        ctx.addIssue({ code: 'custom', path: ['attributes', index, 'attributeValueId'], message: 'Pick a value for this attribute.' });
      }
      if (!row.attributeid && row.attributeValueId) {
        ctx.addIssue({ code: 'custom', path: ['attributes', index, 'attributeid'], message: 'Pick the attribute this value belongs to.' });
      }
    });

    // Two rows sharing an attribute would silently collapse into one entry.
    const seen = new Set<number>();
    rows.forEach((row, index) => {
      if (!row.attributeid) return;
      if (seen.has(row.attributeid)) {
        ctx.addIssue({ code: 'custom', path: ['attributes', index, 'attributeid'], message: 'Each attribute can only appear once per variant.' });
      }
      seen.add(row.attributeid);
    });

    // Editing keeps whatever the variant already has - only a brand-new sibling has to be
    // told apart from the variants already under its product.
    if (isEdit || isFirstVariant) return;
    if (!rows.some((row) => row.attributeid && row.attributeValueId)) {
      ctx.addIssue({ code: 'custom', path: ['attributes'], message: 'Pick at least one attribute, such as Size = L.' });
    }
  });

/** The schema for a brand-new variant that is not its product's first. */
const ProductVariantSchema = getProductVariantSchema(false, false);

export default ProductVariantSchema;

/** Folds the edited rows into the id pairs the API stores, dropping anything half-picked. */
export const rowsToAttributes = (rows: VariantAttributeRow[] = []): z.infer<typeof variantAttributeFields>[] =>
  rows
    .filter((row): row is { attributeid: number; attributeValueId: number } => !!row.attributeid && !!row.attributeValueId)
    .map((row) => ({ attributeid: row.attributeid, attributeValueId: row.attributeValueId }));

/**
 * Reads a stored attributes JSON back into form rows.
 *
 * Rows written since the id migration already are `{ attributeid, attributeValueId }` pairs
 * and pass straight through. Rows written before it hold the old `{ "size": "L" }` record, so
 * each key is matched against the master attribute codes and each value against that
 * attribute's entries (by `value`, then by `name`) to recover the ids. A pair that cannot be
 * resolved comes back blank rather than being dropped, so the gap is visible in the form and
 * has to be re-picked before saving.
 */
export const attributesToRows = (
  attributes: unknown,
  masterAttributes: MasterAttributeDto[] = [],
  masterEntries: MasterEntryDto[] = []
): VariantAttributeRow[] => {
  if (!attributes || typeof attributes !== 'object') return [];

  if (Array.isArray(attributes)) {
    return attributes
      .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
      .map((row) => ({
        attributeid: Number(row.attributeid) > 0 ? Number(row.attributeid) : null,
        attributeValueId: Number(row.attributeValueId) > 0 ? Number(row.attributeValueId) : null,
      }));
  }

  return Object.entries(attributes as Record<string, unknown>).map(([code, value]) => {
    const attribute = masterAttributes.find((item) => item.code.toLowerCase() === code.toLowerCase());
    if (!attribute) return { ...emptyAttributeRow };

    const text = String(value).trim().toLowerCase();
    const entry = masterEntries.find(
      (item) => item.attributeId === attribute.id && (item.value.trim().toLowerCase() === text || item.name.trim().toLowerCase() === text)
    );

    return { attributeid: attribute.id, attributeValueId: entry?.id ?? null };
  });
};
