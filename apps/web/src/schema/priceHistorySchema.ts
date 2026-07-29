import * as Yup from 'yup';

/** Matches the API's zod schema: prices are non-negative, the variant is required. */
export const PriceHistorySchema = Yup.object().shape({
  variantId: Yup.number().min(1, 'Please pick a variant').required('Variant is required'),
  sellingPrice: Yup.number()
    .typeError('Selling price must be a number')
    .min(0, 'Selling price cannot be negative')
    .required('Selling price is required'),
  costPrice: Yup.number().typeError('Cost price must be a number').min(0, 'Cost price cannot be negative').nullable().optional(),
  effectiveFrom: Yup.string().nullable().optional(),
  reason: Yup.string().max(500, 'Reason is too long').nullable().optional(),
});
