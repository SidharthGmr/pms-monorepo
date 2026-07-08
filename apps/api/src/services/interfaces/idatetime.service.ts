export interface IDateTimeService {
  now(): Date;
  nowISO(): string;
  nowISTString(): string;
  nowISTDbString(withSeconds?: boolean): string;
  addMinutes(minutes: number): Date;
}
