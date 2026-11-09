import { z } from 'zod';
import { ExpenseStatusEnum, RecurrenceInterval, RecurrenceIntervalEnum } from '../enum/expense-status.enum';
import { PartyType, PartyTypeEnum } from '../enum/party-type.enum';
import { TaxType, TaxTypeEnum } from '../enum/tax.enum';
import { numeric } from './fields';

const optionalText = z.string().trim().nullish();
const taxTypeField = z.enum(Object.values(TaxTypeEnum) as [TaxType, ...TaxType[]]);
const partyTypeField = z.enum(Object.values(PartyTypeEnum) as [PartyType, ...PartyType[]]);
const recurrenceField = z.enum(Object.values(RecurrenceIntervalEnum) as [RecurrenceInterval, ...RecurrenceInterval[]]);

export const expenseFields = z
  .object({
    expenseDate: optionalText,
    expenseAccountId: numeric(z.number({ error: 'Pick what the money was spent on' }).int().positive('Pick what the money was spent on')),
    paidFromAccountId: numeric(z.number({ error: 'Enter a number' }).int().positive().optional()).nullish(),
    supplierId: numeric(z.number({ error: 'Enter a number' }).int().positive().optional()).nullish(),
    partyType: partyTypeField.nullish(),
    partyId: optionalText,
    referenceNumber: optionalText,
    notes: z.string().nullish(),
    amount: numeric(z.number({ error: 'Enter an amount' }).positive('Amount must be more than zero')),
    taxId: optionalText,
    taxType: taxTypeField.nullish(),
    isInterState: z.boolean().optional(),
    attachments: z.array(z.string()).optional(),
    status: z.enum([ExpenseStatusEnum.Draft, ExpenseStatusEnum.Approved, ExpenseStatusEnum.Paid]).optional(),
    isTemplate: z.boolean().optional(),
    recurrenceInterval: recurrenceField.nullish(),
    recurrenceNextDate: optionalText,
    recurrenceEndDate: optionalText,
  })
  .refine((value) => value.status !== ExpenseStatusEnum.Paid || !!value.paidFromAccountId, {
    message: 'Choose the cash or bank account the money left from',
    path: ['paidFromAccountId'],
  })
  .refine((value) => !value.isTemplate || !!value.recurrenceInterval, {
    message: 'A recurring expense needs a repeat interval',
    path: ['recurrenceInterval'],
  })
  .refine((value) => !value.taxId || !!value.taxType, {
    message: 'Say whether the GST is inside the amount or added on top',
    path: ['taxType'],
  })
  .refine(
    (value) => {
      if (!value.recurrenceNextDate || !value.recurrenceEndDate) return true;
      const next = Date.parse(value.recurrenceNextDate);
      const end = Date.parse(value.recurrenceEndDate);
      return !Number.isFinite(next) || !Number.isFinite(end) || end >= next;
    },
    { message: 'The end date cannot be before the next due date', path: ['recurrenceEndDate'] }
  );

export type ExpenseFormValues = z.infer<typeof expenseFields>;

export const expenseValidator = z.object({ body: expenseFields });

export const expenseStatusFields = z
  .object({
    status: z.enum([ExpenseStatusEnum.Approved, ExpenseStatusEnum.Paid, ExpenseStatusEnum.Cancelled]),
    paidFromAccountId: numeric(z.number({ error: 'Enter a number' }).int().positive().optional()).nullish(),
    paymentDate: optionalText,
    note: z.string().trim().max(500, 'Note must be at most 500 characters').nullish(),
  })
  .refine((value) => value.status !== ExpenseStatusEnum.Paid || !!value.paidFromAccountId, {
    message: 'Choose the cash or bank account the money left from',
    path: ['paidFromAccountId'],
  });

export const expenseStatusValidator = z.object({ body: expenseStatusFields });
