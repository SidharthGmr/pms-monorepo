import { z } from 'zod';
import { AccountCategory, AccountCategoryEnum } from '../enum/account-category.enum';
import { AccountSubType, AccountSubTypeEnum } from '../enum/account-sub-type.enum';
import { StatusEnum } from '../enum/status.enum';
import { numeric, requiredString } from './fields';

const categoryField = z.enum(Object.values(AccountCategoryEnum) as [AccountCategory, ...AccountCategory[]]);
const subTypeField = z.enum(Object.values(AccountSubTypeEnum) as [AccountSubType, ...AccountSubType[]]);

export const ledgerAccountFields = z.object({
  code: requiredString('Account code is required', 20).regex(/^[A-Za-z0-9.\-]+$/, 'Use letters, numbers, dots and hyphens only'),
  name: requiredString('Account name is required', 150),
  category: categoryField,
  subType: subTypeField.optional(),
  parentId: numeric(z.number().int('Pick a valid parent account').optional()).nullish(),
  description: z.string().trim().max(500, 'Must be at most 500 characters').nullish(),
  isActive: z.boolean().optional(),
  status: z.enum([StatusEnum.Published, StatusEnum.Draft, StatusEnum.Trash]).optional(),
  displayOrder: numeric(z.number().int('Must be a whole number').min(0, 'Cannot be negative').optional()),
});

export type LedgerAccountFormValues = z.infer<typeof ledgerAccountFields>;

export const ledgerAccountValidator = z.object({ body: ledgerAccountFields });
