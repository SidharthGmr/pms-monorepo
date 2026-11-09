import { z } from 'zod';
import { AllocationTargetType, AllocationTargetTypeEnum } from '../enum/allocation-target-type.enum';
import { PartyType, PartyTypeEnum } from '../enum/party-type.enum';
import { PaymentDirection, PaymentDirectionEnum } from '../enum/payment-direction.enum';
import { PaymentMethod, PaymentMethodEnum } from '../enum/payment-method.enum';
import { numeric } from './fields';

const directionField = z.enum(Object.values(PaymentDirectionEnum) as [PaymentDirection, ...PaymentDirection[]]);
const partyTypeField = z.enum(Object.values(PartyTypeEnum) as [PartyType, ...PartyType[]]);
const targetTypeField = z.enum(Object.values(AllocationTargetTypeEnum) as [AllocationTargetType, ...AllocationTargetType[]]);
const optionalText = z.string().trim().nullish();

// PAY_LATER means "not paid yet", so it can never be the route a voucher's money travelled by.
const settledMethods = Object.values(PaymentMethodEnum).filter((method) => method !== PaymentMethodEnum.PayLater) as [
  PaymentMethod,
  ...PaymentMethod[],
];

export const paymentAllocationFields = z.object({
  targetType: targetTypeField,
  targetId: numeric(z.number({ error: 'Pick a document' }).int('Pick a document').min(1, 'Pick a document')),
  amount: numeric(z.number({ error: 'Enter an amount' }).min(0.01, 'Must be more than zero')),
});

export const paymentVoucherFields = z
  .object({
    direction: directionField,
    moneyAccountId: numeric(z.number({ error: 'Pick the cash or bank account' }).int('Pick the cash or bank account')),
    counterAccountId: numeric(z.number().int('Pick a valid account').optional()).nullish(),
    partyType: partyTypeField.nullish(),
    partyId: optionalText,
    amount: numeric(z.number({ error: 'Enter an amount' }).min(0.01, 'Must be more than zero')),
    method: z.enum(settledMethods),
    paymentDate: optionalText,
    referenceNumber: z.string().trim().max(100, 'Must be at most 100 characters').nullish(),
    remarks: z.string().trim().max(500, 'Must be at most 500 characters').nullish(),
    allocations: z.array(paymentAllocationFields).optional(),
  })
  .refine((value) => (value.partyId != null && value.partyId !== '') || value.counterAccountId != null, {
    message: 'Choose either a party or the account this money is for',
    path: ['counterAccountId'],
  })
  .refine((value) => value.partyId == null || value.partyId === '' || value.partyType != null, {
    message: 'Say whether this party is a customer or a supplier',
    path: ['partyType'],
  })
  .refine(
    (value) => {
      const allocated = (value.allocations ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      return Math.round(allocated * 100) / 100 <= Math.round((Number(value.amount) || 0) * 100) / 100;
    },
    { message: 'The amounts applied add up to more than the payment', path: ['allocations'] }
  );

export type PaymentVoucherFormValues = z.infer<typeof paymentVoucherFields>;

export const paymentVoucherValidator = z.object({ body: paymentVoucherFields });

export const paymentTransferFields = z
  .object({
    fromAccountId: numeric(z.number({ error: 'Pick the account the money leaves' }).int('Pick an account')),
    toAccountId: numeric(z.number({ error: 'Pick the account the money arrives in' }).int('Pick an account')),
    amount: numeric(z.number({ error: 'Enter an amount' }).min(0.01, 'Must be more than zero')),
    paymentDate: optionalText,
    remarks: z.string().trim().max(500, 'Must be at most 500 characters').nullish(),
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    message: 'Pick two different accounts',
    path: ['toAccountId'],
  });

export type PaymentTransferFormValues = z.infer<typeof paymentTransferFields>;

export const paymentTransferValidator = z.object({ body: paymentTransferFields });

export const reversePaymentFields = z.object({
  reason: z.string().trim().max(500, 'Must be at most 500 characters').nullish(),
});

export const reversePaymentValidator = z.object({ body: reversePaymentFields });
