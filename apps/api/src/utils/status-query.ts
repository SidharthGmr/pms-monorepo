import { StatusEnum } from '@pms/types';
import ClientError from '../exceptions/client-error';

const STATUS_VALUES = Object.values(StatusEnum) as string[];

/**
 * Reads a `status` query value. Absent or empty means "no filter". Anything that is not a
 * real status is a 400 - casting it straight into the Prisma where-clause makes Prisma throw
 * a validation error, which the error handler can only report as a 500.
 */
export function parseStatusQuery(value: unknown): StatusEnum | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !STATUS_VALUES.includes(value)) {
    throw new ClientError(`status must be one of: ${STATUS_VALUES.join(', ')}.`);
  }
  return value as StatusEnum;
}
