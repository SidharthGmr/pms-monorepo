import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

const dateTimeService = () => container.get<IUnitOfService>(TYPES.IUnitOfService).DateTimeService;

/** Relative for today ("just now", "2 hours ago"), "DD MMM, YYYY" otherwise. */
export const formatDate = (date?: Date | string | null): string => (date ? dateTimeService().formatDate(date) : '');

/** "DD MMM, YYYY" in the user's saved timezone; pass displayTime for "DD MMM, YYYY h:mm a". */
export const formatLocalDate = (date?: Date | string | null, displayTime?: boolean, timezone?: string): string =>
  date ? dateTimeService().convertToLocalDate(date, displayTime, timezone) : '';
