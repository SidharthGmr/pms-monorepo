import { z } from 'zod';
import { PaymentMethodEnum } from '../enum/payment-method.enum';
import { ReturnItemConditionEnum } from '../enum/return-item-condition.enum';
import { ReturnStatusEnum } from '../enum/return-status.enum';
import { ReturnTypeEnum } from '../enum/return-type.enum';

/**
 * Flat field schema, shared by the web form and the API.
 *
 * Forms get this one: react-hook-form hands the resolver flat values, so a `body`
 * wrapped schema can never match and the form silently refuses to submit.
 * The API gets the wrapped exports below, because `validate()` parses
 * `{ body, query, params }`. Same rules either way - one source of truth.
 */
export const orderReturnFields = z
  .object({
    orderId: z.number().int().positive('Order is required'),
    type: z.nativeEnum(ReturnTypeEnum),
    reason: z.string().trim().min(1, 'Reason is required').max(500, 'Reason must be at most 500 characters'),
    notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters').nullable().optional(),
    refundMethod: z.nativeEnum(PaymentMethodEnum).nullable().optional(),
    overrideWindow: z.boolean().optional(),
    items: z
      .array(
        z.object({
          orderItemId: z.number().int().positive(),
          quantity: z.number().int().min(1, 'Quantity must be at least 1'),
          condition: z.nativeEnum(ReturnItemConditionEnum).optional(),
        })
      )
      .min(1, 'Pick at least one item to return'),
    exchangeItems: z
      .array(
        z.object({
          variantId: z.number().int().positive(),
          quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        })
      )
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.type === ReturnTypeEnum.Exchange && (!value.exchangeItems || value.exchangeItems.length === 0)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['exchangeItems'], message: 'Pick at least one replacement item for an exchange' });
    }
  });

export const orderReturnValidator = z.object({
  body: orderReturnFields,
});

export const orderReturnStatusFields = z.object({
  status: z.nativeEnum(ReturnStatusEnum),
  refundMethod: z.nativeEnum(PaymentMethodEnum).nullable().optional(),
  refundTransactionId: z.string().trim().max(100, 'Transaction id must be at most 100 characters').nullable().optional(),
  notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters').nullable().optional(),
});

export const orderReturnStatusValidator = z.object({
  body: orderReturnStatusFields,
});
