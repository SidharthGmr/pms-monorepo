import { ReturnStatusEnum, ReturnTypeEnum } from '@pms/types';

/** One tone per status, shared by the table, the detail dialog and the order view. */
export const RETURN_STATUS_TONE: Record<string, { label: string; dot: string; text: string; soft: string }> = {
  [ReturnStatusEnum.Requested]: { label: 'Requested', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', soft: 'bg-amber-500/10' },
  [ReturnStatusEnum.Approved]: { label: 'Approved', dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', soft: 'bg-sky-500/10' },
  [ReturnStatusEnum.Received]: { label: 'Received', dot: 'bg-indigo-500', text: 'text-indigo-700 dark:text-indigo-400', soft: 'bg-indigo-500/10' },
  [ReturnStatusEnum.Completed]: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', soft: 'bg-emerald-500/10' },
  [ReturnStatusEnum.Rejected]: { label: 'Rejected', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', soft: 'bg-rose-500/10' },
  [ReturnStatusEnum.Cancelled]: { label: 'Cancelled', dot: 'bg-zinc-400', text: 'text-zinc-600 dark:text-zinc-400', soft: 'bg-zinc-500/10' },
};

export const returnToneFor = (status?: string | null) =>
  RETURN_STATUS_TONE[String(status ?? '').toUpperCase()] ?? {
    label: status || 'Unknown',
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    soft: 'bg-muted',
  };

export const RETURN_TYPE_LABEL: Record<string, string> = {
  [ReturnTypeEnum.Refund]: 'Refund',
  [ReturnTypeEnum.Exchange]: 'Exchange',
};

/** The moves the workflow allows from each status; mirrors TRANSITIONS in the API service. */
export const RETURN_TRANSITIONS: Record<string, ReturnStatusEnum[]> = {
  [ReturnStatusEnum.Requested]: [ReturnStatusEnum.Approved, ReturnStatusEnum.Rejected, ReturnStatusEnum.Cancelled],
  [ReturnStatusEnum.Approved]: [ReturnStatusEnum.Received, ReturnStatusEnum.Cancelled],
  [ReturnStatusEnum.Received]: [ReturnStatusEnum.Completed],
  [ReturnStatusEnum.Completed]: [],
  [ReturnStatusEnum.Rejected]: [],
  [ReturnStatusEnum.Cancelled]: [],
};
