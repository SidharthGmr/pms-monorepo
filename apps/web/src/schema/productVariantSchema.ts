import * as Yup from 'yup';

/** One "attribute = value" pair being composed in the form. */
export interface VariantAttributeRow {
  /** Master attribute code, e.g. "SIZE" — becomes the key in the attributes JSON. */
  code: string;
  /** Master entry value, e.g. "L". */
  value: string;
}

/** The shape react-hook-form manages for the Add Variant form. */
export interface VariantFormValues {
  name?: string;
  sku?: string;
  stockQuantity?: number | null;
  sellingPrice: number;
  costPrice?: number | null;
  effectiveFrom?: Date | null;
  reason?: string;
  rows: VariantAttributeRow[];
}

const rowSchema: Yup.ObjectSchema<VariantAttributeRow> = Yup.object({
  code: Yup.string().defined().default(''),
  value: Yup.string().defined().default(''),
});

/**
 * `isFirstVariant` decides whether attributes are required: a product's very first variant
 * may stand alone (a book, a bottle), but any later one must be distinguishable, so it needs
 * at least one attribute. Built as a factory because that rule is a prop, not form data.
 */
export const getProductVariantSchema = (isFirstVariant: boolean): Yup.ObjectSchema<VariantFormValues> =>
  Yup.object().shape({
    name: Yup.string().max(150, 'Name is too long').optional(),
    sku: Yup.string().max(100, 'SKU is too long').optional(),
    stockQuantity: Yup.number().integer('Stock must be a whole number').min(0, 'Stock must be zero or greater').nullable().optional(),
    sellingPrice: Yup.number().typeError('Selling price is required').min(0, 'Enter zero or more').required('Selling price is required'),
    costPrice: Yup.number().typeError('Cost price must be a number').min(0, 'Cost price must be zero or greater').nullable().optional(),
    effectiveFrom: Yup.date().nullable().optional(),
    reason: Yup.string().optional(),
    rows: Yup.array()
      .of(rowSchema)
      .defined()
      .default([])
      // Half-filled rows would be dropped silently, taking the user's intent with them.
      .test('no-half-filled', 'Each row needs both an attribute and a value.', (rows) =>
        !(rows ?? []).some((row) => (row.code && !row.value) || (!row.code && row.value))
      )
      // A first variant may stand alone; a later one must be told apart from its siblings.
      .test('at-least-one', 'Pick at least one attribute, such as Size = L.', (rows) =>
        isFirstVariant || (rows ?? []).some((row) => row.code && row.value)
      )
      // Two rows sharing a key would silently collapse into one JSON entry.
      .test('no-duplicates', 'Each attribute can only appear once per variant.', (rows) => {
        const codes = (rows ?? []).filter((row) => row.code && row.value).map((row) => row.code);
        return new Set(codes).size === codes.length;
      }),
  });
