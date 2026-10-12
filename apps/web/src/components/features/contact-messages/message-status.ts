import { ContactMessageStatusEnum } from '@pms/types';

/** One tone per status, shared by the table chip, the dialog and the filter dots. */
export const MESSAGE_STATUS_TONE: Record<string, { label: string; dot: string; text: string; soft: string }> = {
  [ContactMessageStatusEnum.New]: { label: 'New', dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', soft: 'bg-sky-500/10' },
  [ContactMessageStatusEnum.Read]: { label: 'Read', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', soft: 'bg-amber-500/10' },
  [ContactMessageStatusEnum.Resolved]: { label: 'Resolved', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', soft: 'bg-emerald-500/10' },
};

export const messageToneFor = (status?: string | null) =>
  MESSAGE_STATUS_TONE[String(status ?? '').toUpperCase()] ?? { label: status || 'Unknown', dot: 'bg-muted-foreground', text: 'text-muted-foreground', soft: 'bg-muted' };
