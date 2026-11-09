export type JournalStatus = 'POSTED' | 'REVERSED';

export enum JournalStatusEnum {
  Posted = 'POSTED',
  Reversed = 'REVERSED',
}

export const JOURNAL_STATUS_LABELS: Record<JournalStatus, string> = {
  POSTED: 'Posted',
  REVERSED: 'Reversed',
};
