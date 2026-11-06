import { z } from 'zod';
import { DiscountType, DiscountTypeEnum } from '../enum/discount.enum';
import { EstimateStatusEnum } from '../enum/estimate-status.enum';
import { numeric, requiredString } from './fields';

const discountTypeField = z.enum(Object.values(DiscountTypeEnum) as [DiscountType, ...DiscountType[]]);
const optionalText = z.string().trim().nullish();

export const estimateItemFields = z
  .object({
    variantId: numeric(z.number({ error: 'Variant is required' })),
    quantity: numeric(z.number({ error: 'Quantity is required' }).int('Quantity must be a whole number').min(1, 'Quantity must be at least 1')),
    unitPrice: numeric(z.number({ error: 'Enter a number' }).min(0, 'Price cannot be negative').optional()),
    discountType: discountTypeField.nullish(),
    discountValue: numeric(z.number({ error: 'Enter a number' }).min(0, 'Discount cannot be negative').optional()),
    taxId: optionalText,
  })
  .refine((item) => item.discountType !== DiscountTypeEnum.Percentage || (item.discountValue ?? 0) <= 100, {
    message: 'Percentage discount cannot exceed 100',
    path: ['discountValue'],
  });

export const estimateFields = z
  .object({
    customerId: optionalText,
    customerName: requiredString('Customer name is required', 200),
    customerPhone: optionalText,
    customerEmail: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]).nullish(),
    billingAddress: optionalText,
    shippingAddress: optionalText,
    estimateDate: optionalText,
    validUntil: optionalText,
    referenceNumber: optionalText,
    notes: z.string().nullish(),
    terms: z.string().nullish(),
    additionalDiscountType: discountTypeField.nullish(),
    additionalDiscountValue: numeric(z.number({ error: 'Enter a number' }).min(0, 'Discount cannot be negative').optional()),
    shippingCharges: numeric(z.number({ error: 'Enter a number' }).min(0, 'Shipping cannot be negative').optional()),
    adjustment: numeric(z.number({ error: 'Enter a number' }).optional()),
    isInterState: z.boolean().optional(),
    status: z.enum([EstimateStatusEnum.Draft, EstimateStatusEnum.Sent]).optional(),
    items: z.array(estimateItemFields).min(1, 'Add at least one product'),
  })
  .refine(
    (value) => {
      if (!value.estimateDate || !value.validUntil) return true;
      const from = Date.parse(value.estimateDate);
      const until = Date.parse(value.validUntil);
      return !Number.isFinite(from) || !Number.isFinite(until) || until >= from;
    },
    { message: 'Valid until cannot be before the estimate date', path: ['validUntil'] }
  )
  .refine(
    (value) => value.additionalDiscountType !== DiscountTypeEnum.Percentage || (value.additionalDiscountValue ?? 0) <= 100,
    { message: 'Percentage discount cannot exceed 100', path: ['additionalDiscountValue'] }
  );

export type EstimateFormValues = z.infer<typeof estimateFields>;

export const estimateValidator = z.object({ body: estimateFields });
