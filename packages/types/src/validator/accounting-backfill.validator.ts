import { z } from 'zod';
import { PostingSourceType, PostingSourceTypeEnum } from '../model/accounting-backfill.model';
import { numeric } from './fields';

const sourceTypeField = z.enum(Object.values(PostingSourceTypeEnum) as [PostingSourceType, ...PostingSourceType[]]);

export const accountingBackfillFields = z.object({
  sourceType: sourceTypeField,
  afterId: numeric(z.number().int('Must be a whole number').min(0, 'Cannot be negative').optional()),
  limit: numeric(z.number().int('Must be a whole number').min(1, 'Must be at least 1').max(200, 'At most 200 at a time').optional()),
});

export type AccountingBackfillFormValues = z.infer<typeof accountingBackfillFields>;

export const accountingBackfillValidator = z.object({ body: accountingBackfillFields });
