import { z } from 'zod';
import { PartyType, PartyTypeEnum } from '../enum/party-type.enum';
import { MANUAL_VOUCHER_TYPES, VoucherType } from '../enum/voucher-type.enum';
import { validateJournalLines } from '../common/journal-balance';
import { numeric } from './fields';

const partyTypeField = z.enum(Object.values(PartyTypeEnum) as [PartyType, ...PartyType[]]);
const optionalText = z.string().trim().nullish();

export const journalLineFields = z.object({
  ledgerAccountId: numeric(z.number({ error: 'Pick an account' }).int('Pick an account')),
  debit: numeric(z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative').optional()).nullish(),
  credit: numeric(z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative').optional()).nullish(),
  narration: z.string().trim().max(300, 'Must be at most 300 characters').nullish(),
  partyType: partyTypeField.nullish(),
  partyId: optionalText,
});

/**
 * The balance rule lives in `validateJournalLines`, not here, so the API and the form enforce
 * exactly the same arithmetic. This wrapper only moves those messages onto the right field.
 */
export const journalEntryFields = z
  .object({
    voucherType: z.enum(MANUAL_VOUCHER_TYPES as [VoucherType, ...VoucherType[]]).optional(),
    entryDate: optionalText,
    narration: z.string().trim().max(500, 'Must be at most 500 characters').nullish(),
    referenceNumber: z.string().trim().max(100, 'Must be at most 100 characters').nullish(),
    lines: z.array(journalLineFields).min(2, 'A journal entry needs at least two lines'),
  })
  .superRefine((value, ctx) => {
    for (const message of validateJournalLines(value.lines)) {
      ctx.addIssue({ code: 'custom', message, path: ['lines'] });
    }
  })
  .refine((value) => value.lines.length !== 2 || value.lines[0]?.ledgerAccountId !== value.lines[1]?.ledgerAccountId, {
    message: 'A two-line entry cannot debit and credit the same account',
    path: ['lines'],
  });

export type JournalEntryFormValues = z.infer<typeof journalEntryFields>;

export const journalEntryValidator = z.object({ body: journalEntryFields });

export const reverseJournalEntryFields = z.object({
  entryDate: optionalText,
  narration: z.string().trim().max(500, 'Must be at most 500 characters').nullish(),
});

export const reverseJournalEntryValidator = z.object({ body: reverseJournalEntryFields });
