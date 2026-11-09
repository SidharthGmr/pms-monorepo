import { z } from 'zod';
import { requiredString } from './fields';

export const financialYearFields = z
  .object({
    name: requiredString('Financial year name is required', 50),
    startDate: requiredString('Start date is required'),
    endDate: requiredString('End date is required'),
  })
  .refine(
    (value) => {
      const from = Date.parse(value.startDate);
      const until = Date.parse(value.endDate);
      return !Number.isFinite(from) || !Number.isFinite(until) || until > from;
    },
    { message: 'End date must be after the start date', path: ['endDate'] }
  );

export type FinancialYearFormValues = z.infer<typeof financialYearFields>;

export const financialYearValidator = z.object({ body: financialYearFields });
